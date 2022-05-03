import GcpFileWriter from '../gcp/GcpFileWriter';

class CloudVideoWriter {
  static BUCKET = 'videos.moshh-338102.appspot.com';

  static async writeVideo(srcPath: string, videoId: string) {
    let finalDst = `videos/library/${videoId}/${videoId}.mp4`;
    return GcpFileWriter.writeFile(srcPath, finalDst);
  }
}

export default CloudVideoWriter;
