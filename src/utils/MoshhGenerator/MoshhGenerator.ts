import _ from 'lodash';
import {ConstellationInfo, ConstellationManager} from '../ConstellationManager';
import {MediaUtils, AudioFormatType, ClipConcatInfo} from '../MediaUtils';
import {ILocalFileStore} from '../../localStorage';
import {
  MoshhGeneratorOptions,
  MoshhGeneratorOutputOptions,
  MoshhGeneratorProgressCallback,
  MoshhGeneratorProgressStatus,
} from './types';

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
    minSubclipDuration: number,
    maxSubclipDuration: number,
    {
      preset = 'medium',
      output_pix_fmt = 'yuv420p',
      video_codec = 'libx264',
      fps = 30000 / 1001,
      width = 1080,
      height = 1920,
    }: MoshhGeneratorOutputOptions,
  ) {
    // Pre-compute some variables
    const durationDiff = maxSubclipDuration - minSubclipDuration;
    const maxDuration = Math.max(...offsets.map(o => o[1]));

    // Build the timeline
    let concatInputs: ClipConcatInfo[] = [];
    let t = 0;
    while (t < maxDuration) {
      // Choose a random clip that aligns
      let randIdx = -1;
      while (true) {
        randIdx = this.getRandomIndex(weights);
        if (offsets[randIdx][0] <= t && offsets[randIdx][1] > t) {
          break;
        }
      }

      // Compute the duration of the clip, based on random duration
      // and remaining duration on the random video choice
      let clipDuration;
      const remainingDuration = offsets[randIdx][1] - t;
      if (remainingDuration < maxSubclipDuration) {
        clipDuration = remainingDuration;
      } else {
        clipDuration = Math.random() * durationDiff + minSubclipDuration;
      }

      // correct the offset to be local to the video, not global to the timeline
      const correctedT = t - offsets[randIdx][0];

      // Save the input to the list
      concatInputs.push({
        videoPath: videoPaths[randIdx],
        startPointSecs: correctedT,
        duration: clipDuration,
      });

      console.log(
        `Clip: global_t ${t}, startPoint ${correctedT}, duration ${clipDuration}, video ${videoPaths[randIdx]}`,
      );

      // Update the global point
      t += clipDuration;
    }

    // Clip, merge, and re-encode the clips
    await assertMediaUtil(
      MediaUtils.clipConcatReencode(
        concatInputs,
        outputPath,
        preset,
        output_pix_fmt,
        video_codec,
        fps,
        width,
        height,
      ),
    );
  }

  static async _handleStatus(
    message: string,
    status: MoshhGeneratorProgressStatus,
    callback?: MoshhGeneratorProgressCallback,
  ) {
    console.log(message);
    callback?.(status, message);
  }

  static async generateMoshh(
    videoPaths: string[],
    weights: number[],
    {
      outputVideoPath,
      minSubclipDuration = 4.0,
      maxSubclipDuration = 6.0,
      outputVideoFormat = 'mov',
      preloadedConstellations = [],
      preset = 'medium',
      output_pix_fmt = 'yuv420p',
      video_codec = 'libx264',
      fps = 30000 / 1001,
      width = 1080,
      height = 1920,
      statusCallback,
    }: MoshhGeneratorOptions & MoshhGeneratorOutputOptions = {},
  ) {
    // Validate the inputs
    if (videoPaths.length <= 1) {
      throw 'Not enough videos';
    }

    let tmpFileRelPaths: string[] = [];
    let finalOutputPath = outputVideoPath; // Initialize the final output as the input param. If its undefined, it will be replaced

    try {
      const mediaInfos = await Promise.all(
        videoPaths.map(async path => {
          return await MediaUtils.getMediaInformation(path);
        }),
      );

      // Extract the audios
      this._handleStatus(
        'Extracting Audios',
        MoshhGeneratorProgressStatus.ExtractingAudio,
        statusCallback,
      );
      const audioRelPaths = await this.extractAudios(videoPaths);
      tmpFileRelPaths.concat(audioRelPaths);

      // Generate the constellations
      this._handleStatus(
        'generating constellations',
        MoshhGeneratorProgressStatus.GeneratingConstellations,
        statusCallback,
      );
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
      this._handleStatus(
        'calculating offsets',
        MoshhGeneratorProgressStatus.CalculatingOffsets,
        statusCallback,
      );
      const durations = mediaInfos.map(info => Number(info.getDuration()));
      const globalOffsets = this.computeGlobalOffsets(
        constellations,
        durations,
      );

      console.log(globalOffsets);

      // Compile the videos
      this._handleStatus(
        'compiling video',
        MoshhGeneratorProgressStatus.CompilingVideo,
        statusCallback,
      );
      const startTime = Date.now();
      const videoCompilationRelPath = this.getTmpRelativePath(
        `vidComp.${outputVideoFormat}`,
      );
      await this.compileMoshhVideo(
        videoPaths,
        weights,
        globalOffsets,
        this.#localFileStore!.absolutePath(videoCompilationRelPath),
        minSubclipDuration,
        maxSubclipDuration,
        {
          preset,
          output_pix_fmt,
          video_codec,
          fps,
          width,
          height,
        },
      );
      tmpFileRelPaths.push(videoCompilationRelPath);
      const endTime = Date.now();
      console.log('Time to compile', endTime - startTime);

      // Fade the audios
      this._handleStatus(
        'fading audios',
        MoshhGeneratorProgressStatus.FadingAudios,
        statusCallback,
      );
      const fadedPaths = await this.fadeAudios(audioRelPaths);
      tmpFileRelPaths.concat(fadedPaths);

      // Merge the audio files
      this._handleStatus(
        'Merging Audio Files',
        MoshhGeneratorProgressStatus.MergingAudios,
        statusCallback,
      );
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

      // Compile the outpath path
      if (finalOutputPath === undefined) {
        const randNum = _.random(1e6, false);
        finalOutputPath = this.#localFileStore!.absolutePath(
          this.getTmpRelativePath(`moshh${randNum}.jpg`),
        );
      }

      // Overlay the audio files
      this._handleStatus(
        'overlaying audios',
        MoshhGeneratorProgressStatus.OverlayingAudios,
        statusCallback,
      );
      await assertMediaUtil(
        MediaUtils.overlayAudioOnVideo(
          this.#localFileStore!.absolutePath(videoCompilationRelPath),
          this.#localFileStore!.absolutePath(mergedAudioRelPath),
          finalOutputPath!,
        ),
      );
      // Clean up unnecessary files
    } catch (err) {
      console.log('Got an error generating moshh', err);
    } finally {
      // Delete any tmp files that were created
      this._handleStatus(
        'cleaning up tmp files',
        MoshhGeneratorProgressStatus.CleaningUp,
        statusCallback,
      );
      for (let p of tmpFileRelPaths) {
        this.#localFileStore?.deleteFile(p);
      }

      // Indicate the process is done
      this._handleStatus(
        'finished',
        MoshhGeneratorProgressStatus.Finished,
        statusCallback,
      );
    }

    return finalOutputPath;
  }
}
