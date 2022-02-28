import React from 'react';
import {UserDbRecordType} from '../utils/firestoreDb';
import {VideoScreen} from '../screens';

export type GlobalContextType = {
  userInfo?: UserDbRecordType | null;
  setUserInfo?: (record: UserDbRecordType) => void;
  signOutUser?: () => void;
  videoScreenRef?: React.MutableRefObject<VideoScreen | null>;
  setVideoScreenRef?: (ref: VideoScreen) => void;
};

export const defaultValue = {};

export const GlobalContext =
  React.createContext<GlobalContextType>(defaultValue);
