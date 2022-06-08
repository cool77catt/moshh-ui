import 'react-native-get-random-values'; // Need to import before uuid. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
import {v4 as uuidv4} from 'uuid';

export function generateUUID() {
  return uuidv4().toUpperCase();
}
