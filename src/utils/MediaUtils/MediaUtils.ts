import {
  FFmpegKit,
  FFprobeKit,
  FFmpegSession,
  ReturnCode,
  SessionState,
  FFmpegKitConfig,
} from 'ffmpeg-kit-react-native';
import {ILocalFileStore} from '../../localStorage';
import {byteArrayToUInt16} from '../byteArrayUtils';
import {generateUUID} from '../uuid';
import _ from 'lodash';
import {
  AudioFormatType,
  ExecutionInfo,
  AudioData,
  CompressionSpeed,
  ClipConcatInfo,
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

  static async execute(cmd: string): Promise<boolean> {
    console.log('ffmpeg executing', cmd);
    const session = await FFmpegKit.execute(cmd);

    this.#executionInfo = {
      ...(await this.getSessionInfo(session)),
      command: cmd,
    };

    // Make sure the session is completed
    const state = await session.getState();
    switch (state) {
      case SessionState.COMPLETED:
        break;
      case SessionState.FAILED:
        return false;
      default:
        console.log('FFMPEG did not complete', state);
        return false;
    }

    const returnCode = await session.getReturnCode();

    let status = ReturnCode.isSuccess(returnCode);
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

  static async extractAudioFromVideo(
    videoPath: string,
    audioFormat: AudioFormatType,
    outputAudioPath: string,
    bitrate: number = 1920000,
  ) {
    // Compile the command.  The "-y" means overwrite if file already exists - otherwise the command will fail
    const cmd = `-y -i ${videoPath} -f ${audioFormat} -ab ${bitrate} -vn ${outputAudioPath}`;
    return this.execute(cmd);
  }

  static async getAudioRate(audioPath: string) {
    const mediaInfo = await this.getMediaInformation(audioPath);
    return Number(mediaInfo.getStreams()[0].getSampleRate());
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
    const cmd = `-y -i ${audioPath} -ac 1 -f s16le -acodec pcm_s16le ${pcmAbsFilePath}`;
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

    let cmd = `-y -i ${audioPath} -af "${fadeParams}" ${outputPath}`;
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

    const inputFlags = audioPaths.map(a => `-i ${a}`).join(' ');

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

    const cmd = `-y ${inputFlags} -filter_complex "${delayParams};${mixParams}" -map [mixout] ${outputPath}`;
    return this.execute(cmd);
  }

  static async overlayAudioOnVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ) {
    const cmd = `-y -i ${videoPath} -i ${audioPath} -c:v copy -map 0:v -map 1:a ${outputPath}`;
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
    const cmd = `-y -i ${videoPath} -ss ${startTimestamp} -t ${durationTimestamp} -c copy ${audioFlag} ${outputPath}`;
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
    const cmd = `-y -f concat -safe 0 -i ${absInputPath} -c copy ${outputPath}`;

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
    compressionSpeed: CompressionSpeed = 'medium',
  ) {
    /**
     * Example:
     * -ss 60.75 -t 5.15 -i 7405C001-AAE7-4BFA-A902-E3A982BD348B.mov \
     * -ss 65.90 -t 5.25 -i 2EE85F61-681C-41A0-90F2-3BD2120412B0.mov \
     * -filter_complex "[0][1]concat=n=2:v=1:a=0" -preset faster output.mov
     */
    let globalStart = 0;
    const inputStr = inputArray
      .map(info => {
        const localStr = `-ss ${globalStart} -t ${info.duration} -i ${info.audioPath}`;
        globalStart += info.duration;
        return localStr;
      })
      .join(' ');

    const filterInputStr = _.range(0, inputArray.length)
      .map(i => `[${i}]`)
      .join('');
    const filterStr = `${filterInputStr}concat=n=${inputArray.length}:v=1:a=0`;

    const cmd = `${inputStr} -filter_complex "${filterStr}" -preset ${compressionSpeed} ${outputPath}`;
    return this.execute(cmd);
  }
}
