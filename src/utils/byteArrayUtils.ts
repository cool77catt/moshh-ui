import {Buffer} from 'buffer';

export function byteArrayToUInt16(byteArray: Buffer) {
  let results: number[] = [];
  for (let i = 0; i < byteArray.length; i += 2) {
    const sample = byteArray.readInt16LE(i);
    results.push(sample);
  }
  return results;
}
