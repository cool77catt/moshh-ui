export function timeToString(timestampSecs: number, precise = true) {
  let duration = timestampSecs;
  const mins = Math.floor(duration / 60);
  duration -= mins * 60;
  const secs = Math.floor(duration);
  duration -= secs;
  const msecs = Math.floor(duration * 1000);

  let result = `${mins}:${secs.toString().padStart(2, '0')}`;
  if (precise) {
    result += `.${msecs.toString().padStart(3, '0')}`;
  }

  return result;
}
