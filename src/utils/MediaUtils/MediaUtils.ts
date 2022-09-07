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
  PresetType,
  ClipConcatInfo,
  RotationOutput,
} from './types';

export class MediaUtils {
  static TMP_DIRECTORY_PATH = 'moshh-util-tmp';
  static TMP_INPUT_FILE_PATH = 'tmpInput.txt';
  static DEFAULT_FADE_DURATION = 1.0;

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

  static async getVideoFrameRate(
    videoPath: string,
    mediaInfo?: MediaInformation,
  ) {
    if (!mediaInfo) {
      mediaInfo = await this.getMediaInformation(videoPath);
    }

    const [num, den] = mediaInfo.getStreams()[0].getRealFrameRate().split('/');
    return Number(num) / Number(den);
  }

  static async getVideoRotation(videoPath: string): Promise<RotationOutput> {
    // const cmd = `-v 0 -select_streams v:0 -show_entries stream_tags=rotate -of default=nw=1:nk=1 ${videoPath}`;
    const cmd = `-i ${videoPath} -f ffmetadata -`;
    const session = await FFmpegKit.execute(cmd);
    // const session = await FFprobeKit.execute(cmd);
    const returnCode = await session.getReturnCode();
    const output = await session.getOutput();
    const state = await session.getState();
    const stackTrace = await session.getFailStackTrace();

    let result = -1;
    let status = false;
    console.log('ret code', ReturnCode.isSuccess(returnCode));
    if (ReturnCode.isSuccess(returnCode) && output !== '') {
      try {
        result = Number(output);
        status = true;
      } catch (err) {
        console.error('error getting video rotation', err);
        console.error('output', output);
      }
    }
    return {
      rotation: result,
      status,
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
    outputPath: string,
    size?: [number, number],
  ) {
    let cmd = `-ss ${timestamp} -i ${videoPath} `;
    cmd += '-vframes 1 ';
    if (size) {
      cmd += `-s ${size[0]}x${size[1]} `;
    }
    cmd += `-y ${outputPath}`;
    return this.execute(cmd);
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

  static async createSubclip(
    videoPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    excludeAudio: boolean = true,
  ) {
    const audioFlag = excludeAudio ? '-an' : '';
    const startTimestamp = this.secsToTimestampString(startTime);
    const durationTimestamp = this.secsToTimestampString(duration);
    const cmd = `-y -i "${videoPath}" -ss ${startTimestamp} -t ${durationTimestamp} -c copy ${audioFlag} "${outputPath}"`;
    return this.execute(cmd);
  }

  static async mergeVideoClips(clipPaths: string[], outputPath: string) {
    const tmpFilePath = MediaUtils.getTmpPath(MediaUtils.TMP_INPUT_FILE_PATH);
    const fileContents = clipPaths.map(path => `file '${path}'`).join('\n');

    // Write the input file to be used with ffmpeg
    const absInputPath = await this.#localFileStore!.writeFile(
      tmpFilePath,
      fileContents,
    );

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
    preset: PresetType = 'medium',
    output_pix_fmt = 'yuv420p',
    video_codec = 'libx264',
    fps = 30000 / 1001,
    width = 1080,
    height = 1920,
  ) {
    // setup constants
    const input_pix_fmt = 'rgb24';

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
        cmd += `-s ${width}x${height} `;
        cmd += `-pix_fmt ${input_pix_fmt} `;
        cmd += `-r ${fps} `;
        cmd += `-an -i "${pipes[idx]}" `;
        return cmd;
      })
      .join('');

    // Use the frames to create the output video
    const concatInputStr = _.range(pipes.length)
      .map(idx => `[${idx}]`)
      .join('');
    outputCmd += `-filter_complex "${concatInputStr}concat=n=${pipes.length}:v=1:a=0" `;
    outputCmd += `-vcodec ${video_codec} -preset ${preset} -pix_fmt ${output_pix_fmt} `;
    outputCmd += `${outputPath} -y`;
    console.log('executing main session');
    console.log(outputCmd);
    const mainSession = await FFmpegKit.executeAsync(outputCmd);

    // Write the pipes
    let fCount = 0;
    let cumDuration = 0;
    for (let [idx, input] of inputArray.entries()) {
      cumDuration += input.duration;
      const endPointFrames = cumDuration * fps;
      const durationFrames = Math.floor(endPointFrames - fCount);

      // Create the pipe
      let cmd = `-ss ${input.startPointSecs} -i ${input.videoPath} `;
      cmd += '-f image2pipe ';
      cmd += `-pix_fmt ${input_pix_fmt} `;
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
          console.log('sleeping on main process');
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
