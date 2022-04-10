import React from 'react';
import {UserDbRecordType} from '../utils/firestoreDb';
import VideoModal from '../components/VideoModal';

export type GlobalContextType = {
  userInfo?: UserDbRecordType | null;
  setUserInfo?: (record: UserDbRecordType) => void;
  signOutUser?: () => void;
  videoModalRef?: React.MutableRefObject<VideoModal | null>;
  setVideoModalRef?: (ref: VideoModal) => void;
};

export const defaultValue = {};

export const GlobalContext =
  React.createContext<GlobalContextType>(defaultValue);
