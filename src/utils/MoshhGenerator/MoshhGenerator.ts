import _ from 'lodash';
import {ConstellationInfo, ConstellationManager} from '../ConstellationManager';
import {MediaUtils, AudioFormatType, VideoOutputOptions} from '../MediaUtils';
import {ILocalFileStore} from '../../localStorage';
import {
  MoshhGeneratorOptions,
  MoshhGeneratorStatusCallback,
  MoshhGeneratorStage,
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
  static DEFAULT_MOSHH_OPTIONS: MoshhGeneratorOptions = {
    minSubclipDuration: 4.0,
    maxSubclipDuration: 6.0,
    outputVideoFormat: 'mov',
    preloadedConstellations: [],
    statusCallback: null,
  };

  static #localFileStore: ILocalFileStore | undefined;

  static async configure(localFileStore: ILocalFileStore) {
    this.#localFileStore = localFileStore;

    // Create the tmp directory (or clear out any remaining artifacts)
    await localFileStore.makeDirectory(this.TMP_DIRECTORY_PATH);
    await localFileStore.cleanDirectory(this.TMP_DIRECTORY_PATH);
  }

  static allOptions(options: MoshhGeneratorOptions) {
    return {...this.DEFAULT_MOSHH_OPTIONS, ...options};
  }

  static getTmpRelativePath(relativePath: string) {
    return this.TMP_DIRECTORY_PATH + '/' + relativePath;
  }

  static async _handleStatus(
    stage: MoshhGeneratorStage,
    progress: number,
    message: string,
    callback?: MoshhGeneratorStatusCallback | null,
  ) {
    console.debug(stage, progress, message);
    callback?.(stage, progress, message);
  }

  static async extractAudios(
    videoPaths: string[],
    statusCallback?: MoshhGeneratorStatusCallback | null,
  ): Promise<string[]> {
    let audioRelPaths: string[] = [];

    try {
      for (let idx = 0; idx < videoPaths.length; idx++) {
        const vidPath = videoPaths[idx];

        // Update the status
        this._handleStatus(
          MoshhGeneratorStage.ExtractingAudio,
          (idx / videoPaths.length) * 100,
          `Extracting audio ${idx + 1} of ${videoPaths.length}...`,
          statusCallback,
        );

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

  static async fadeAudios(
    audioRelPaths: string[],
    statusCallback?: MoshhGeneratorStatusCallback | null,
  ) {
    let outputPaths: string[] = [];
    try {
      for (let i = 0; i < audioRelPaths.length; i++) {
        // Update the status
        this._handleStatus(
          MoshhGeneratorStage.FadingAudios,
          (i / audioRelPaths.length) * 100,
          `Fading audio ${i + 1} of ${audioRelPaths.length}...`,
          statusCallback,
        );

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

  static updateActiveVideos(offsets: [number, number][], currentTime: number) {
    const activeIndices: number[] = [];
    offsets.forEach(([start, end], idx) => {
      if (start <= currentTime && end > currentTime) {
        // Video is active, add it if it hasn't already been
        activeIndices.push(idx);
      }
    });
    return activeIndices;
  }

  static async compileMoshhVideo(
    videoPaths: string[],
    weights: number[],
    offsets: [number, number][],
    outputPath: string,
    {
      moshhOptions = this.DEFAULT_MOSHH_OPTIONS,
      mediaOptions = MediaUtils.DEFAULT_VIDEO_OUTPUT_OPTIONS,
    },
  ) {
    // Pre-compute some variables
    moshhOptions = this.allOptions(moshhOptions);
    mediaOptions = MediaUtils.allOptions(mediaOptions);
    const totalDuration = Math.max(...offsets.map(o => o[1]));
    const subclips: string[] = [];

    // zip the paths weights and offsets
    const videoProcList = videoPaths.map((path, idx) => {
      return {
        path,
        weight: weights[idx],
        offset: offsets[idx],
      };
    });

    try {
      let t = 0;
      while (t < totalDuration) {
        // Determine which videos of the remaining videos fall within the current time range
        const activeIndices = this.updateActiveVideos(
          videoProcList.map(v => v.offset),
          t,
        );

        // Choose a random clip that aligns
        let randIdx = this.getRandomIndex(
          activeIndices.map(i => videoProcList[i].weight),
        );
        const videoIdx = activeIndices[randIdx]; // Get the video index
        const activeVideo = videoProcList[videoIdx];

        // Compute the duration of the clip, based on random duration
        // and remaining duration on the random video choice
        let clipDuration;
        const remainingDuration = activeVideo.offset[1] - t;
        if (remainingDuration < moshhOptions.maxSubclipDuration!) {
          clipDuration = remainingDuration;

          // Remove the video from remaining videos as we have used up the last of it.
          // Note, we are removing it because the rounding of computations could leave
          // this video in the list if we go just off of comparing the start and end times
          videoProcList.splice(videoIdx, 1);
        } else {
          clipDuration = _.random(
            moshhOptions.minSubclipDuration!,
            moshhOptions.maxSubclipDuration!,
            true,
          );
        }

        // correct the offset to be local to the video, not global to the timeline
        const correctedT = t - activeVideo.offset[0];

        // Update the status
        this._handleStatus(
          MoshhGeneratorStage.CompilingVideo,
          (t / totalDuration) * 100,
          `${Math.floor(t)} of ${Math.floor(totalDuration)} seconds...`,
          moshhOptions.statusCallback,
        );

        // Create the subclip
        const randId = _.random(1e6, false);
        const subclipPathAbs = this.#localFileStore!.absolutePath(
          this.getTmpRelativePath(
            `subclip_${randId}.${moshhOptions.outputVideoFormat}`,
          ),
        );
        await assertMediaUtil(
          MediaUtils.createSubClip(
            activeVideo.path,
            subclipPathAbs,
            correctedT,
            clipDuration,
            mediaOptions,
          ),
        );

        // Add the subclip
        subclips.push(subclipPathAbs);

        console.log(
          `Clip: global_t ${t}, startPoint ${correctedT}, duration ${clipDuration}, video ${activeVideo.path}`,
        );

        // Read the actual duration of the subclip
        const clipMeta = await MediaUtils.getVideoInformation(subclipPathAbs);
        t += clipMeta.duration;
      }

      // Concatenate the final video
      await assertMediaUtil(MediaUtils.mergeVideoClips(subclips, outputPath));
    } finally {
      // Delete the subclips
      for (let clip of subclips) {
        await this.#localFileStore?.deleteFileAbs(clip);
      }
    }
  }

  static async generateMoshh(
    videoPaths: string[],
    weights: number[],
    outputVideoPath: string | null = null,
    options?: {
      moshhOptions?: MoshhGeneratorOptions;
      mediaOptions?: VideoOutputOptions;
    },
  ): Promise<string | null> {
    // Validate the inputs
    if (videoPaths.length <= 1) {
      throw 'Not enough videos';
    }
    if (weights.filter(w => w <= 0).length > 0) {
      throw 'Invalid weight(s)';
    }

    const moshhOptions = this.allOptions(
      options && options.moshhOptions ? options.moshhOptions : {},
    );
    const mediaOptions = MediaUtils.allOptions(
      options && options.mediaOptions ? options.mediaOptions : {},
    );

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
        MoshhGeneratorStage.ExtractingAudio,
        0,
        'Extracting audios...',
        moshhOptions.statusCallback,
      );
      const audioRelPaths = await this.extractAudios(
        videoPaths,
        moshhOptions.statusCallback,
      );
      tmpFileRelPaths.concat(audioRelPaths);

      // Generate the constellations
      let constellations: ConstellationInfo[] = [];
      if (moshhOptions.preloadedConstellations!.length === 0) {
        for (let [idx, path] of audioRelPaths.entries()) {
          // Set the status
          this._handleStatus(
            MoshhGeneratorStage.GeneratingConstellations,
            (idx / audioRelPaths.length) * 100,
            `Generating constellation ${idx + 1} of ${audioRelPaths.length}...`,
            moshhOptions.statusCallback,
          );

          // Generate the constellation and add
          const constellation =
            await ConstellationManager.generateConstellation(
              this.#localFileStore!.absolutePath(path),
            );
          constellations.push(constellation);
        }
      } else {
        constellations = moshhOptions.preloadedConstellations!;
      }

      // Get the global offsets
      this._handleStatus(
        MoshhGeneratorStage.CalculatingOffsets,
        0,
        'Calculating offsets...',
        moshhOptions.statusCallback,
      );
      const durations = mediaInfos.map(info => Number(info.getDuration()));
      const globalOffsets = this.computeGlobalOffsets(
        constellations,
        durations,
      );

      console.log(globalOffsets);

      // Compile the videos
      this._handleStatus(
        MoshhGeneratorStage.CompilingVideo,
        0,
        'compiling videos...',
        moshhOptions.statusCallback,
      );
      const startTime = Date.now();
      const videoCompilationRelPath = this.getTmpRelativePath(
        `vidComp.${moshhOptions.outputVideoFormat}`,
      );
      await this.compileMoshhVideo(
        videoPaths,
        weights,
        globalOffsets,
        this.#localFileStore!.absolutePath(videoCompilationRelPath),
        {
          moshhOptions,
          mediaOptions,
        },
      );
      tmpFileRelPaths.push(videoCompilationRelPath);
      const endTime = Date.now();
      console.log('Time to compile', endTime - startTime);

      // Fade the audios
      this._handleStatus(
        MoshhGeneratorStage.FadingAudios,
        0,
        'Fading audios...',
        moshhOptions.statusCallback,
      );
      const fadedPaths = await this.fadeAudios(
        audioRelPaths,
        moshhOptions.statusCallback,
      );
      tmpFileRelPaths.concat(fadedPaths);

      // Merge the audio files
      this._handleStatus(
        MoshhGeneratorStage.MergingAudios,
        0,
        'Merging audio files...',
        moshhOptions.statusCallback,
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
      if (finalOutputPath === null) {
        const ext = moshhOptions.outputVideoFormat!;
        const randNum = _.random(1e6, false);
        finalOutputPath = this.#localFileStore!.absolutePath(
          this.getTmpRelativePath(`moshh${randNum}.${ext}`),
        );
      }

      // Overlay the audio files
      this._handleStatus(
        MoshhGeneratorStage.OverlayingAudios,
        0,
        'Overlaying audio...',
        moshhOptions.statusCallback,
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
      for (let [idx, p] of tmpFileRelPaths.entries()) {
        this._handleStatus(
          MoshhGeneratorStage.CleaningUp,
          (idx / tmpFileRelPaths.length) * 100,
          `Cleaning up tmp file ${idx + 1} of ${tmpFileRelPaths.length}...`,
          moshhOptions.statusCallback,
        );
        this.#localFileStore?.deleteFile(p);
      }

      // Indicate the process is done
      this._handleStatus(
        MoshhGeneratorStage.Finished,
        100,
        'Finished.',
        moshhOptions.statusCallback,
      );
    }

    return finalOutputPath;
  }
}
