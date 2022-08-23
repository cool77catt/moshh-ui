import {MediaUtils} from './MediaUtils';

export class ConstellationGenerator {
  constructor() {
    console.log('constructor');
  }

  static async generate_constellation(audioFilePath: string) {
    MediaUtils.loadAudioBuffer(audioFilePath);
    audio, audio_rate = load_audio(audio)

    h_bins = make_horiz_bins(audio, 1024, 0, 512)
    v_bins = make_vert_bins(h_bins, 43)
    bin_max = find_bin_max(v_bins, 7)

    return Constellation(audio_rate, bin_max)
  }
}
