import {firebase} from '@react-native-firebase/storage';

class GcpFileWriter {
  static async writeFile(srcPath: string, dstPath: string) {
    console.log(dstPath);
    const storage = firebase.storage();
    return storage.ref(dstPath).putFile(srcPath);
    // await GcpFileWriter._storage.bucket(dstBucket).upload(srcPath, {
    //   destination: dstPath,
    // });
  }
}

export default GcpFileWriter;
