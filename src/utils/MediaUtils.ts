import {
  FFmpegKit,
  FFprobeKit,
  FFmpegSession,
  ReturnCode,
  SessionState,
  FFmpegKitConfig,
  Log,
  Statistics,
} from 'ffmpeg-kit-react-native';
import {ILocalFileStore} from '../localStorage';
import {byteArrayToUInt16} from './byteArrayUtils';

export type AudioFormatType = 'wav';

export type ExecutionInfo = {
  logs: Log[];
  failStackTrace: string;
  output: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  statistics: Statistics[];
  command?: string;
};

export type AudioMergeInputType = {
  audioPath: string;
  delay: number;
};

export class MediaUtils {
  static TMP_DIRECTORY_PATH = 'moshh-gen-tmp';
  static TMP_INPUT_FILE_PATH = 'tmpInput.txt';
  static TMP_PCM_FILE_PATH = 'tmpPCM.pcm';
  static DEFAULT_FADE_DURATION = 1.0;

  // private members
  #localFileStore: ILocalFileStore;
  #executionInfo: ExecutionInfo | undefined;

  // static private class properties
  static #instance: MediaUtils | null = null;

  static getInstance() {
    return this.#instance;
  }

  static async configure(localFileStore: ILocalFileStore) {
    if (this.#instance == null) {
      this.#instance = new MediaUtils(localFileStore);

      // Create the tmp directory (or clear out any remaining artifacts)
      await localFileStore.makeDirectory(this.TMP_DIRECTORY_PATH);
      const remnants = await localFileStore.readDirectory(
        this.TMP_DIRECTORY_PATH,
      );
      remnants.forEach(dirItem => {
        localFileStore.deleteFile(dirItem.name);
      });

      // Disable logs (by default, ffmpeg library prints logs)
      FFmpegKitConfig.enableLogCallback(() => {});
    }
    return this.getInstance();
  }

  static getTmpPath(relativePath: string) {
    return this.TMP_DIRECTORY_PATH + '/' + relativePath;
  }

  constructor(localFileStore: ILocalFileStore) {
    this.#localFileStore = localFileStore;
  }

  getExecutionInfo() {
    return this.#executionInfo;
  }

  async getSessionInfo(session: FFmpegSession): Promise<ExecutionInfo> {
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

  async execute(cmd: string): Promise<boolean> {
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

  async getMediaInformation(filePath: string) {
    const session = await FFprobeKit.getMediaInformation(filePath);
    const information = await session.getMediaInformation();

    if (information === undefined) {
      throw await session.getOutput();
    }

    return information;
  }

  async extractAudioFromVideo(
    videoPath: string,
    audioFormat: AudioFormatType,
    outputAudioPath: string,
    bitrate: number = 1920000,
  ) {
    // Compile the command.  The "-y" means overwrite if file already exists - otherwise the command will fail
    const cmd = `-y -i ${videoPath} -f ${audioFormat} -ab ${bitrate} -vn ${outputAudioPath}`;
    return this.execute(cmd);
  }

  async loadAudioBuffer(audioPath: string) {
    // Write the raw data to a pcm file
    const pcmRelFilePath = MediaUtils.getTmpPath(MediaUtils.TMP_PCM_FILE_PATH);

    // Get the absolute filepath of the tmp to input to ffmpeg
    const pcmAbsFilePath = this.#localFileStore.absolutePath(pcmRelFilePath);

    // Use FFMPEG to create a new temporary file
    const cmd = `-y -i ${audioPath} -ac 1 -f s16le -acodec pcm_s16le ${pcmAbsFilePath}`;
    const status = await this.execute(cmd);
    if (!status) {
      throw this.#executionInfo?.output;
    }

    try {
      // Read in the raw data from the pcm file
      const rawBytes = await this.#localFileStore.readBinaryFile(
        pcmRelFilePath,
      );
      return byteArrayToUInt16(rawBytes);
    } finally {
      // Delete the temp file
      console.log('delete file bitch');
      await this.#localFileStore.deleteFile(pcmRelFilePath);
    }
  }

  async fadeInOutAudio(
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

  async mergeAudioFiles(audioFiles: AudioMergeInputType[], outputPath: string) {
    const inputFlags = audioFiles.map(a => `-i ${a.audioPath}`).join(' ');

    // Add the delays
    const delayParams = audioFiles
      .map((a, idx) => `[${idx}]adelay=delays=${a.delay}s:all=1[s${idx}]`)
      .join(';');

    const mixInputs = audioFiles.map((_, idx) => `[s${idx}]`).join('');
    const mixParams = `${mixInputs}amix=inputs=${audioFiles.length}:duration=longest[mixout]`;

    const cmd = `-y ${inputFlags} -filter_complex "${delayParams};${mixParams}" -map [mixout] ${outputPath}`;
    return this.execute(cmd);
  }

  async overlayAudioOnVideo(
    videoPath: string,
    audioPath: string,
    outputPath: string,
  ) {
    const cmd = `-y -i ${videoPath} -i ${audioPath} -c:v copy -map 0:v -map 1:a ${outputPath}`;
    return this.execute(cmd);
  }

  async clipVideo(
    videoPath: string,
    outputPath: string,
    startTime: number,
    duration: number,
    excludeAudio: boolean = true,
  ) {
    const audioFlag = excludeAudio ? '-an' : '';
    const cmd = `-y -i ${videoPath} -ss ${startTime} -t ${duration} -c copy ${audioFlag} ${outputPath}`;
    return this.execute(cmd);
  }

  async mergeVideoClips(clipPaths: string[], outputPath: string) {
    const tmpFilePath = MediaUtils.getTmpPath(MediaUtils.TMP_INPUT_FILE_PATH);
    const fileContents = clipPaths.map(path => `file '${path}'`).join('\n');

    // Write the input file to be used with ffmpeg
    const absInputPath = await this.#localFileStore.writeFile(
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
      await this.#localFileStore.deleteFile(tmpFilePath);
    }

    return result;
  }
}
