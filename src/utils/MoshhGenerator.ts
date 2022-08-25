import {ConstellationInfo, ConstellationManager} from './ConstellationManager';
import {MediaUtils, AudioFormatType} from './MediaUtils';
import {ILocalFileStore} from '../localStorage';
import _ from 'lodash';

async function assertMediaUtil(promise: Promise<boolean>) {
  if (!(await promise)) {
    const exeInfo = MediaUtils.getExecutionInfo();
    throw exeInfo?.output;
  }
}

export class MoshhGenerator {
  static TMP_DIRECTORY_PATH = 'moshh-gen-tmp';
  static AUDIO_FMT = 'wav';

  static #localFileStore: ILocalFileStore | undefined;

  static async configure(localFileStore: ILocalFileStore) {
    this.#localFileStore = localFileStore;

    // Create the tmp directory (or clear out any remaining artifacts)
    await localFileStore.makeDirectory(this.TMP_DIRECTORY_PATH);
    await localFileStore.cleanDirectory(this.TMP_DIRECTORY_PATH);
  }

  static getTmpRelativePath(relativePath: string) {
    return this.TMP_DIRECTORY_PATH + '/' + relativePath;
  }

  static async extractAudios(videoPaths: string[]): Promise<string[]> {
    let audioRelPaths: string[] = [];

    try {
      for (let idx = 0; idx < videoPaths.length; idx++) {
        const vidPath = videoPaths[idx];

        // Extract Audio
        const audioRelPath = this.getTmpRelativePath(
          `moshh_audio_${idx}.${this.AUDIO_FMT}`,
        );
        await assertMediaUtil(
          MediaUtils.extractAudioFromVideo(
            vidPath,
            this.AUDIO_FMT as AudioFormatType,
            this.#localFileStore!.absolutePath(audioRelPath),
          ),
        );

        // Append the path
        audioRelPaths.push(audioRelPath);
      }
    } catch (err) {
      console.log('extract audio caught error', err);
      // Delete any tmp files that were created
      audioRelPaths.forEach(path => this.#localFileStore?.deleteFile(path));

      // Re-throw the error
      throw err;
    }

    return audioRelPaths;
  }

  static async fadeAudios(audioRelPaths: string[]) {
    let outputPaths: string[] = [];
    try {
      for (let i = 0; i < audioRelPaths.length; i++) {
        const inputRelPath = audioRelPaths[i];
        const outputRelPath = this.getTmpRelativePath(
          `faded_audio_${i}.${this.AUDIO_FMT}`,
        );
        await assertMediaUtil(
          MediaUtils.fadeInOutAudio(
            this.#localFileStore!.absolutePath(inputRelPath),
            this.#localFileStore!.absolutePath(outputRelPath),
          ),
        );
        outputPaths.push(outputRelPath);
      }
    } catch (err) {
      for (let p in outputPaths) {
        this.#localFileStore!.deleteFile(p);
      }

      throw err;
    }

    return outputPaths;
  }

  static computeGlobalOffsets(
    constellations: ConstellationInfo[],
    durations: number[],
  ) {
    // Compute the offsets. Start by setting the first video to global starting point
    // and analyzing each video afterwards
    let globalOffsets: [number, number][] = Array<[number, number]>(
      constellations.length,
    ).fill([-1, -1]);

    console.log('durations', durations);

    // Set the first video to be the global starting point (for now)
    globalOffsets[0] = [0, durations[0]];
    for (let srcIdx = 1; srcIdx < constellations.length; srcIdx++) {
      const srcConst = constellations[srcIdx];
      // Loop to find the first overlap.
      for (let baseIdx = 0; baseIdx < constellations.length; baseIdx++) {
        const baseConst = constellations[baseIdx];

        // Ignore if the base hasn't recieved an offset yet (or we're comparing the same video)
        if (globalOffsets[baseIdx][0] < 0 || baseIdx === srcIdx) {
          continue;
        }

        // Compute the offset and validate overlap
        const [srcOffset, status] = ConstellationManager.computeOffset(
          baseConst,
          srcConst,
        );
        if (!status) {
          continue;
        }
        console.log('offset calc', srcOffset);

        // compute the global offset
        const srcGlobalOffset = globalOffsets[baseIdx][0] + srcOffset;
        globalOffsets[srcIdx] = [
          srcGlobalOffset,
          srcGlobalOffset + durations[srcIdx],
        ];

        // if the global offset is negative we need to re-shift all the global offsets to set this
        // as the starting point
        if (srcGlobalOffset < 0) {
          // Subtracting is equivalent to multipying my -1 and adding.
          // The source global offset will be negative the same amount
          // that the globals have to be offset by
          globalOffsets = globalOffsets.map(off => [
            off[0] - srcGlobalOffset,
            off[1] - srcGlobalOffset,
          ]);
        }

        // Break from the for loop as we have find a matching clip, non need to
        // traverse anywhere
        break;
      }
    }

    return globalOffsets;
  }

  static getRandomIndex(weights: number[]) {
    const weightSum = _.sum(weights);
    const randChoice = Math.random() * weightSum;
    let accum = 0;
    let randIdx = -1;
    for (let i = 0; i < weights.length; i++) {
      accum += weights[i];
      if (accum >= randChoice) {
        randIdx = i;
        break;
      }
    }
    return randIdx;
  }

  static async compileMoshhVideo(
    videoPaths: string[],
    weights: number[],
    offsets: [number, number][],
    outputPath: string,
    outputVideoFormat: string,
    minSubclipDuration: number,
    maxSubclipDuration: number,
  ) {
    // Pre-compute some variables
    const durationDiff = maxSubclipDuration - minSubclipDuration;
    const maxDuration = Math.max(...offsets.map(o => o[1]));

    // Build the timeline
    let clipRelPaths: string[] = [];
    let t = 0;
    try {
      while (t < maxDuration) {
        console.log(`Creating subclip for t=${t}`);
        // Choose a random clip that aligns
        let randIdx = -1;
        while (true) {
          randIdx = this.getRandomIndex(weights);
          if (offsets[randIdx][0] <= t) {
            break;
          }
        }

        // Compute the duration of the clip, based on random duration
        // and remaining duration on the random video choice
        let clipDuration = Math.random() * durationDiff + minSubclipDuration;
        clipDuration = Math.min(clipDuration, offsets[randIdx][1] - t);
        // clipDuration = Math.floor(clipDuration * 1000

        // correct the offset to be local to the video, not global to the timeline
        const correctedT = t - offsets[randIdx][0];

        // Create the subclip, save the file temporarily
        const clipRelPath = this.getTmpRelativePath(
          `moshh_subclip_${clipRelPaths.length}.${outputVideoFormat}`,
        );
        await assertMediaUtil(
          MediaUtils.createSubclip(
            videoPaths[randIdx],
            this.#localFileStore!.absolutePath(clipRelPath),
            correctedT,
            clipDuration,
            true,
          ),
        );
        clipRelPaths.push(clipRelPath);

        // Update the global point
        t += clipDuration;
      }

      // Merge the clips
      await assertMediaUtil(
        MediaUtils.mergeVideoClips(
          clipRelPaths.map(p => this.#localFileStore!.absolutePath(p)),
          outputPath,
        ),
      );
    } finally {
      // Delete the clips
      for (let clipPath of clipRelPaths) {
        this.#localFileStore?.deleteFile(clipPath);
      }
    }
  }

  static async generateMoshh(
    videoPaths: string[],
    weights: number[],
    outputVideoPath: string,
    minSubclipDuration: number = 4.0,
    maxSubclipDuration: number = 6.0,
    outputVideoFormat: string = 'mov',
    preloadedConstellations: ConstellationInfo[] = [],
  ) {
    // Validate the inputs
    if (videoPaths.length <= 1) {
      throw 'Not enough videos';
    }

    // Generate the constellations
    let tmpFileRelPaths: string[] = [];

    try {
      const mediaInfos = await Promise.all(
        videoPaths.map(async path => {
          return await MediaUtils.getMediaInformation(path);
        }),
      );

      // Extract the audios
      console.log('extracting audios');
      const audioRelPaths = await this.extractAudios(videoPaths);
      tmpFileRelPaths.concat(audioRelPaths);

      // Generate the constellations
      console.log('generating constellations');
      let constellations: ConstellationInfo[] = [];
      if (preloadedConstellations.length === 0) {
        for (let path of audioRelPaths) {
          const constellation =
            await ConstellationManager.generateConstellation(
              this.#localFileStore!.absolutePath(path),
            );
          constellations.push(constellation);
        }
      } else {
        constellations = preloadedConstellations;
      }

      // Get the global offsets
      console.log('calculating offsets');
      const durations = mediaInfos.map(info => Number(info.getDuration()));
      const globalOffsets = this.computeGlobalOffsets(
        constellations,
        durations,
      );

      console.log(globalOffsets);

      // Compile the videos
      console.log('Compiling video');
      const videoCompilationRelPath = this.getTmpRelativePath(
        `vidComp.${outputVideoFormat}`,
      );
      await this.compileMoshhVideo(
        videoPaths,
        weights,
        globalOffsets,
        this.#localFileStore!.absolutePath(videoCompilationRelPath),
        outputVideoFormat,
        minSubclipDuration,
        maxSubclipDuration,
      );
      tmpFileRelPaths.push(videoCompilationRelPath);

      // Fade the audios
      const fadedPaths = await this.fadeAudios(audioRelPaths);
      tmpFileRelPaths.concat(fadedPaths);

      // Merge the audio files
      console.log('merging audios');
      const mergedAudioRelPath = this.getTmpRelativePath(
        `merged_audio.${this.AUDIO_FMT}`,
      );
      await assertMediaUtil(
        MediaUtils.mergeAudioFiles(
          fadedPaths.map(p => this.#localFileStore!.absolutePath(p)),
          globalOffsets.map(o => o[0]),
          this.#localFileStore!.absolutePath(mergedAudioRelPath),
        ),
      );
      tmpFileRelPaths.push(mergedAudioRelPath);

      // Overlay the audio files
      console.log('overlaying audios');
      await assertMediaUtil(
        MediaUtils.overlayAudioOnVideo(
          this.#localFileStore!.absolutePath(videoCompilationRelPath),
          this.#localFileStore!.absolutePath(mergedAudioRelPath),
          outputVideoPath,
        ),
      );

      console.log('done');

      // Clean up unnecessary files
    } catch (err) {
      console.log('Got an error generating moshh', err);
    } finally {
      // Delete any tmp files that were created
      for (let p of tmpFileRelPaths) {
        this.#localFileStore?.deleteFile(p);
      }
    }
  }
}
