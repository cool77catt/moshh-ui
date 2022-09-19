import {
  FFmpegKit,
  FFprobeKit,
  FFmpegSession,
  ReturnCode,
  SessionState,
  FFmpegKitConfig,
  MediaInformation,
} from 'ffmpeg-kit-react-native';
import {ILocalFileStore} from '../../localStorage';
import {byteArrayToUInt16} from '../byteArrayUtils';
import {generateUUID} from '../uuid';
import _ from 'lodash';
import {
  AudioFormatType,
  ExecutionInfo,
  AudioData,
  VideoInfo,
  VideoOutputOptions,
  ClipConcatInfo,
} from './types';

export class MediaUtils {
  static TMP_DIRECTORY_PATH = 'moshh-util-tmp';
  static TMP_INPUT_FILE_PATH = 'tmpInput.txt';
  static DEFAULT_FADE_DURATION = 1.0;
  static DEFAULT_VIDEO_OUTPUT_OPTIONS: VideoOutputOptions = {
    preset: 'ultrafast',
    pixelFormat: 'yuv420p',
    videoCodec: 'libx264',
    fps: 30000 / 1001,
    width: 1080,
    height: 1920,
    excludeAudio: false,
  };

  // private members
  static #localFileStore: ILocalFileStore | undefined;
  static #executionInfo: ExecutionInfo | undefined;

  static async configure(localFileStore: ILocalFileStore) {
    this.#localFileStore = localFileStore;

    // Create the tmp directory (or clear out any remaining artifacts)
    await localFileStore.makeDirectory(this.TMP_DIRECTORY_PATH);
    await localFileStore.cleanDirectory(this.TMP_DIRECTORY_PATH);

    // Disable logs (by default, ffmpeg library prints logs)
    FFmpegKitConfig.enableLogCallback(() => {});
  }

  static getTmpPath(relativePath: string) {
    return this.TMP_DIRECTORY_PATH + '/' + relativePath;
  }

  static allOptions(options: VideoOutputOptions) {
    return {...this.DEFAULT_VIDEO_OUTPUT_OPTIONS, ...options};
  }

  static getExecutionInfo() {
    return this.#executionInfo;
  }

  static async getSessionInfo(session: FFmpegSession): Promise<ExecutionInfo> {
    return {
      failStackTrace: await session.getFailStackTrace(),
      logs: await session.getLogs(),
      output: await session.getOutput(),
      startTime: await session.getStartTime(),
      endTime: await session.getEndTime(),
      duration: await session.getDuration(),
      statistics: await session.getStatistics(),
    };
  }

  static async checkSession(
    session: FFmpegSession,
    cmd: string,
  ): Promise<[SessionState, boolean]> {
    this.#executionInfo = {
      ...(await this.getSessionInfo(session)),
      command: cmd,
    };

    // Get the state and status
    const state = await session.getState();
    const returnCode = await session.getReturnCode();
    let status = ReturnCode.isSuccess(returnCode);
    return [state, status];
  }

  static async execute(cmd: string): Promise<boolean> {
    console.log('ffmpeg executing', cmd);
    const session = await FFmpegKit.execute(cmd);

    const [state, status] = await this.checkSession(session, cmd);

    // Make sure the session is completed
    switch (state) {
      case SessionState.COMPLETED:
        break;
      case SessionState.FAILED:
        return false;
      default:
        console.log('FFMPEG did not complete', state);
        return false;
    }

    return status;
  }

  static async getMediaInformation(filePath: string) {
    const session = await FFprobeKit.getMediaInformation(filePath);
    const information = await session.getMediaInformation();

    if (information === undefined) {
      throw await session.getOutput();
    }

    return information;
  }

  static async getVideoInformation(videoPath: string): Promise<VideoInfo> {
    const information = await this.getMediaInformation(videoPath);
    const vidStream = information.getStreams()[0];

    // Get the width/height
    const width = vidStream.getWidth();
    const height = vidStream.getHeight();
    const duration = Number(information.getDuration());

    // get the rotation
    let rotation: number | undefined;
    let effectiveWidth = width;
    let effectiveHeight = height;
    try {
      rotation = vidStream.getProperties('side_data_list')[0].rotation;

      // Compute the effective width/height
      const absRotation = Math.abs(rotation!);
      if (absRotation === 90 || absRotation === 270) {
        effectiveWidth = height;
        effectiveHeight = width;
      }
    } catch {
      console.debug('No rotation information', videoPath);
    }

    // Get the fps
    const fpsString = vidStream.getRealFrameRate();
    let fps;
    if (fpsString.includes('/')) {
      const [num, den] = fpsString.split('/');
      fps = Number(num) / Number(den);
    } else {
      fps = Number(fpsString);
    }

    return {
      width,
      height,
      aspectRatio: width / height,
      duration,
      effectiveWidth,
      effectiveHeight,
      effectiveAspectRatio: effectiveWidth / effectiveHeight,
      rotation,
      fpsString,
      fps,
    };
  }

  static async getAudioRate(audioPath: string, mediaInfo?: MediaInformation) {
    if (!mediaInfo) {
      mediaInfo = await this.getMediaInformation(audioPath);
    }
    return Number(mediaInfo.getStreams()[0].getSampleRate());
  }

  static async extractAudioFromVideo(
    videoPath: string,
    audioFormat: AudioFormatType,
    outputAudioPath: string,
    bitrate: number = 1920000,
  ) {
    // Compile the command.  The "-y" means overwrite if file already exists - otherwise the command will fail
    const cmd = `-y -i "${videoPath}" -f ${audioFormat} -ab ${bitrate} -vn "${outputAudioPath}"`;
    return this.execute(cmd);
  }

  static async loadAudioData(audioPath: string): Promise<AudioData> {
    // Load the audio meta data
    const rate = await this.getAudioRate(audioPath);

    // Write the raw data to a pcm file
    const randomFilename = `${generateUUID()}.pcm`;
    const pcmRelFilePath = MediaUtils.getTmpPath(randomFilename);

    // Get the absolute filepath of the tmp to input to ffmpeg
    const pcmAbsFilePath = this.#localFileStore!.absolutePath(pcmRelFilePath);

    // Use FFMPEG to create a new temporary file
    const cmd = `-y -i "${audioPath}" -ac 1 -f s16le -acodec pcm_s16le "${pcmAbsFilePath}"`;
    const status = await this.execute(cmd);
    if (!status) {
      throw this.#executionInfo?.output;
    }

    try {
      // Read in the raw data from the pcm file
      const rawBytes = await this.#localFileStore!.readBinaryFile(
        pcmRelFilePath,
      );
      return {
        data: byteArrayToUInt16(rawBytes),
        rate,
      };
    } finally {
      // Delete the temp file
      await this.#localFileStore!.deleteFile(pcmRelFilePath);
    }
  }

  static async fadeInOutAudio(
    audioPath: string,
    outputPath: string,
    fadeInDuration: number = MediaUtils.DEFAULT_FADE_DURATION,
    fadeOutDuration: number = MediaUtils.DEFAULT_FADE_DURATION,
  ) {
    const mediaInfo = await this.getMediaInformation(audioPath);
    const duration = Number(mediaInfo.getDuration());

    const outStartTime = duration - fadeOutDuration;
    const fadeParams = `afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${outStartTime}:d=${fadeOutDuration}`;

    let cmd = `-y -i "${audioPath}" -af "${fadeParams}" "${outputPath}"`;
    return this.execute(cmd);
  }

  static async mergeAudioFiles(
    audioPaths: string[],
    delays: number[],
    outputPath: string,
  ) {
    // Get the sample rates of the audio files
    let rates: number[] = [];
    for (let p of audioPaths) {
      // Load the audio meta data
      rates.push(await this.getAudioRate(p));
    }

    const inputFlags = audioPaths.map(a => `-i "${a}"`).join(' ');

    // Add the delays.  Note, FFMPEG doesn't handle floats for this,
    // so instead we convert to samples using the sample rate (delay * samples/sec)
    const delayParams = delays
      .map((delay, idx) => {
        // rates
        const delaySamples = Math.floor(delay * rates[idx]);
        return `[${idx}]adelay=delays=${delaySamples}S:all=1[s${idx}]`;
      })
      .join(';');

    const mixInputs = _.range(0, audioPaths.length)
      .map(i => `[s${i}]`)
      .join('');
    const mixParams = `${mixInputs}amix=inputs=${audioPaths.length}:duration=longest[mixout]`;

    const cmd = `-y ${inputFlags} -filter_complex "${delayParams};${mixParams}" -map [mixout] "${outputPath}"`;
    return this.execute(cmd);
  }

  static async overlayAudioOnVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ) {
    const cmd = `-y -i "${videoPath}" -i "${audioPath}" -c:v copy -map 0:v -map 1:a "${outputPath}"`;
    return this.execute(cmd);
  }

  static async generateThumbnail(
    videoPath: string,
    timestamp: number,
    options?: {
      outputPath?: string;
      size?: [number, number];
    },
  ) {
    let cmd = `-ss ${timestamp} -i ${videoPath} `;
    cmd += '-vframes 1 ';
    if (options && options.size) {
      cmd += `-s ${options.size[0]}x${options.size[1]} `;
    }

    // Check the output path
    let outputPath = '';
    if (!options || options.outputPath === undefined) {
      const randNum = _.random(100, false);
      outputPath = this.#localFileStore!.absolutePath(
        this.getTmpPath(`thumb${randNum}.jpg`),
      );
    } else {
      outputPath = options.outputPath;
    }

    cmd += `-y ${outputPath}`;
    if (await this.execute(cmd)) {
      return outputPath;
    } else {
      console.error(
        'failed to generate thumbnail',
        this.#executionInfo?.output,
      );
    }
  }

  static secsToTimestampString(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const hoursStr = hours.toString().padStart(2, '0');
    seconds -= hours * 3600;

    const mins = Math.floor(seconds / 60);
    const minsStr = mins.toString().padStart(2, '0');
    seconds -= mins * 60;

    const correctedSecs = Math.floor(seconds);
    const correctedSecsStr = correctedSecs.toString().padStart(2, '0');
    seconds -= correctedSecs;

    const msecs = Math.round(seconds * 1000);
    const msecsStr = msecs.toString().padStart(3, '0');

    return `${hoursStr}:${minsStr}:${correctedSecsStr}.${msecsStr}`;
  }

  static async createSubClip(
    videoPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    options = this.DEFAULT_VIDEO_OUTPUT_OPTIONS,
  ) {
    options = this.allOptions(options);
    const audioFlag = options.excludeAudio ? '-an' : '';
    const startTimestamp = this.secsToTimestampString(startTime);
    const durationTimestamp = this.secsToTimestampString(duration);

    // compile the command
    let cmd = `-y -ss ${startTimestamp} -t ${durationTimestamp} -i "${videoPath}" `;
    cmd += `-preset ${options.preset} -vcodec ${options.videoCodec} -pix_fmt ${options.pixelFormat} `;
    cmd += `-r ${options.fps} -s ${options.width}x${options.height} `;
    cmd += `${audioFlag} "${outputPath}"`;
    return this.execute(cmd);
  }

  static async mergeVideoClips(clipPaths: string[], outputPath: string) {
    const tmpFilePath = MediaUtils.getTmpPath(MediaUtils.TMP_INPUT_FILE_PATH);
    const fileContents = clipPaths.map(path => `file '${path}'`).join('\n');

    // Write the input file to be used with ffmpeg
    console.log('merge writing merge file', tmpFilePath);
    const absInputPath = await this.#localFileStore!.writeFile(
      tmpFilePath,
      fileContents,
    );
    console.log('merge wrote merge file', absInputPath);

    // Compile the command
    const cmd = `-y -f concat -safe 0 -i "${absInputPath}" -c copy "${outputPath}"`;

    // Execute the command
    let result = false;
    try {
      result = await this.execute(cmd);
    } finally {
      await this.#localFileStore!.deleteFile(tmpFilePath);
    }

    return result;
  }

  /**
   * Function to perform the clipping, concating, and re-encoding of the video
   * in one command, to reduce redundant re-encodings.  Note the reencoding
   * is necessary to get accurate results.
   */
  static async clipConcatReencode(
    inputArray: ClipConcatInfo[],
    outputPath: string,
    options = this.DEFAULT_VIDEO_OUTPUT_OPTIONS,
  ) {
    // Fill in gaps with defaults
    options = this.allOptions(options);

    // setup constants
    const inputPixelFormat = 'rgb24';

    // Create the pipes
    const pipes = await Promise.all(
      _.range(inputArray.length).map(() =>
        FFmpegKitConfig.registerNewFFmpegPipe(),
      ),
    );

    // Setup the output command
    let outputCmd = inputArray
      .map((input, idx) => {
        // Create the input section of the output command
        let cmd = '';
        cmd += '-f rawvideo -vcodec rawvideo ';
        cmd += `-s ${options.width}x${options.height} `;
        cmd += `-pix_fmt ${inputPixelFormat} `;
        cmd += `-r ${options.fps} `;
        cmd += `-an -i "${pipes[idx]}" `;
        return cmd;
      })
      .join('');

    // Use the frames to create the output video
    const concatInputStr = _.range(pipes.length)
      .map(idx => `[${idx}]`)
      .join('');
    outputCmd += `-filter_complex "${concatInputStr}concat=n=${pipes.length}:v=1:a=0" `;
    outputCmd += `-vcodec ${options.videoCodec} -preset ${options.preset} -pix_fmt ${options.pixelFormat} `;
    outputCmd += `${outputPath} -y`;
    console.log('executing main session');
    console.log(outputCmd);
    const mainSession = await FFmpegKit.executeAsync(outputCmd);

    // Write the pipes
    let fCount = 0;
    let cumDuration = 0;
    for (let [idx, input] of inputArray.entries()) {
      cumDuration += input.duration;
      const endPointFrames = cumDuration * options.fps!;
      const durationFrames = Math.floor(endPointFrames - fCount);

      // Create the pipe
      let cmd = `-ss ${input.startPointSecs} -i ${input.videoPath} `;
      cmd += '-f image2pipe ';
      cmd += `-pix_fmt ${inputPixelFormat} `;
      cmd += `-an -c:v rawvideo -frames ${durationFrames} `;
      cmd += `-y "${pipes[idx]}"`;

      console.log('executing pipe input', cmd);
      FFmpegKit.execute(cmd).then(async session => {
        // Close the pipe
        FFmpegKitConfig.closeFFmpegPipe(pipes[idx]);

        const [state, status] = await this.checkSession(session, cmd);
        console.log(`session finished ${status} ${state} cmd=${cmd}`);
        if (!status) {
          throw this.getExecutionInfo()?.output;
        }
      });

      // Update the fcount
      fCount += durationFrames;
    }

    // Wait for the main process to finish
    let state: SessionState;
    do {
      this.checkSession(mainSession, outputCmd);

      this.#executionInfo = {
        ...(await this.getSessionInfo(mainSession)),
        command: outputCmd,
      };

      state = await mainSession.getState();
      switch (state) {
        case SessionState.RUNNING:
          // sleep
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
        case SessionState.COMPLETED:
          console.log('main process finished');
          break;
        case SessionState.FAILED:
          console.error('ffmpeg async failed', this.#executionInfo.output);
          return false;
      }
    } while (state === SessionState.RUNNING || state === SessionState.CREATED);

    // close the pipes
    await Promise.all(pipes.map(pipe => FFmpegKitConfig.closeFFmpegPipe(pipe)));

    const returnCode = await mainSession.getReturnCode();
    console.log('video finished return code', returnCode);
    return ReturnCode.isSuccess(returnCode);
  }
}
