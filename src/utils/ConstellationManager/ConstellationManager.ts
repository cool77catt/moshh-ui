import {MediaUtils} from '../MediaUtils';
import {fft, util as fftUtil} from 'fft-js';
import {
  BinValueType,
  HorizontalBin,
  VerticalBin,
  ConstellationInfo,
  Constellation,
} from './types';

export class ConstellationManager {
  static fourier(data: number[]) {
    const phasors = fft(data);
    const mags = fftUtil.fftMag(phasors); // It looks like this already gives us the "real" fft
    return mags;
  }

  static findFreqPairs(
    baseConstellation: Constellation,
    srcConstellation: Constellation,
  ) {
    let freqPairs: [number, number][] = [];

    baseConstellation.forEach((baseValues, key) => {
      if (srcConstellation.has(key)) {
        baseValues.forEach(baseVal => {
          srcConstellation.get(key)!.forEach(srcVal => {
            freqPairs.push([baseVal, srcVal]);
          });
        });
      }
    });

    return freqPairs;
  }

  static findDelay(
    freqPairs: [number, number][],
    rate: number,
    fftBinSize: number = 1024,
  ) {
    const tDiffs = new Map<number, number>();
    freqPairs.forEach(freqPair => {
      const delta = freqPair[0] - freqPair[1];
      const count = tDiffs.has(delta) ? tDiffs.get(delta)! + 1 : 1;
      tDiffs.set(delta, count);
    });

    // Find the highest count to get the time
    let maxCount = -1;
    let timeDelay = -1;
    tDiffs.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        timeDelay = key;
      }
    });

    const samplesPerSec = rate / fftBinSize;
    const seconds = timeDelay / samplesPerSec;
    return seconds;
  }

  /*
   * computeOffset() - computes the offsets between base audio and a src audio
   *  Returns the offset in seconds. The offset is the amount of time to add to the src
   *  to line it up with the base.
   *  A positive number means the src audio begins
   *  AFTER the base, whereas a negative numbers means the src audio begins BEFORE
   *  the base.
   */
  static computeOffset(
    baseConstellation: ConstellationInfo,
    srcConstellation: ConstellationInfo,
  ): [number, boolean] {
    if (baseConstellation.rate !== srcConstellation.rate) {
      throw 'Different audio rates is not supported at this time';
    }

    const freqPairs = this.findFreqPairs(
      baseConstellation.constellation,
      srcConstellation.constellation,
    );

    const offset = this.findDelay(freqPairs, srcConstellation.rate);

    // validate the offset, ensure the videos overlap
    let status = true;

    return [offset, status];
  }

  static makeHorizontalBins(
    data: number[],
    fftBinSize: number,
    overlap: number,
    boxHeight: number,
  ): HorizontalBin {
    let horizBins = new HorizontalBin();

    // process first sample and set matrix height
    let sampleData = data.slice(0, fftBinSize); // get data for first sample
    if (sampleData.length === fftBinSize) {
      //if there are enough audio points left to create a full fft bin

      const intensities = this.fourier(sampleData); // intensities is list of fft results
      for (let i = 0; i < intensities.length; i++) {
        const boxY = Math.floor(i / boxHeight);
        const binEntry: [number, number, number] = [intensities[i], 0, i];
        horizBins.add(boxY, binEntry);
      }
    }

    // process remainder of samples
    let xCoordCounter = 1; // starting at second sample, with x index 1
    for (
      var j = Math.floor(fftBinSize - overlap);
      j < data.length;
      j += Math.floor(fftBinSize - overlap)
    ) {
      sampleData = data.slice(j, j + fftBinSize);
      if (sampleData.length === fftBinSize) {
        const intensities = this.fourier(sampleData); // intensities is list of fft results
        for (let k = 0; k < intensities.length; k++) {
          const boxY = Math.floor(k / boxHeight);
          const binEntry: [number, number, number] = [
            intensities[k],
            xCoordCounter,
            k,
          ];
          horizBins.add(boxY, binEntry);
        }
      }
      xCoordCounter += 1;
    }

    return horizBins;
  }

  static makeVerticalBins(horizBins: HorizontalBin, boxWidth: number) {
    let vertBin = new VerticalBin();
    horizBins.getMap().forEach((hBinArray, key) => {
      hBinArray.forEach(hBinVal => {
        const boxX = Math.floor(hBinVal[1] / boxWidth);
        vertBin.add([boxX, key], hBinVal);
      });
    });
    return vertBin;
  }

  static getMinTuple(tupleArray: BinValueType[]): [BinValueType, number] {
    let res = tupleArray[0];
    let globalMin = Math.min(...tupleArray[0]);
    let minIdx = 0;

    for (let i = 1; i < tupleArray.length; i++) {
      const localMin = Math.min(...tupleArray[i]);
      if (localMin < globalMin) {
        res = tupleArray[i];
        globalMin = localMin;
        minIdx = i;
      }
    }

    return [res, minIdx];
  }

  static findBinMax(vertBins: VerticalBin, maxesPerBox: number) {
    let freqsMap = new Map<number, number[]>();
    vertBins.getMap().forEach(binValues => {
      const maxIntensities: BinValueType[] = [[1, 2, 3]];

      // Iterate the bins
      binValues.forEach(binVal => {
        const [minTuple] = this.getMinTuple(maxIntensities);
        if (binVal[0] > minTuple[0]) {
          maxIntensities.push(binVal);
          if (maxIntensities.length > maxesPerBox) {
            // remove the min tuple value
            const [, minIdx] = this.getMinTuple(maxIntensities);
            maxIntensities.splice(minIdx, 1);
          }
        }
      });

      // iterate through the max intensities
      maxIntensities.forEach(binVal => {
        if (freqsMap.has(binVal[2])) {
          freqsMap.get(binVal[2])!.push(binVal[1]);
        } else {
          freqsMap.set(binVal[2], [binVal[1]]);
        }
      });
    });

    return freqsMap;
  }

  static async generateConstellation(
    audioFilePath: string,
  ): Promise<ConstellationInfo> {
    console.log('creating data');
    const {data, rate} = await MediaUtils.loadAudioData(audioFilePath);

    console.log('creating hbins');
    const hBins = this.makeHorizontalBins(data, 1024, 0, 512);
    console.log('creating vbins');
    const vBins = this.makeVerticalBins(hBins, 43);
    console.log('creating minMax');
    const constellation = this.findBinMax(vBins, 7);

    return {
      rate,
      constellation,
    };
  }
}
