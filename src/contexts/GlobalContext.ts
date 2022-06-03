import React from 'react';
import {UserInfo} from '../controllers';
import VideoModal from '../components/VideoModal';

export type GlobalContextType = {
  userInfo?: UserInfo | null;
  setUserInfo?: (record: UserInfo) => void;
  signOutUser?: () => void;
  videoModalRef?: React.MutableRefObject<VideoModal | null>;
  setVideoModalRef?: (ref: VideoModal) => void;
};

export const defaultValue = {};

export const GlobalContext =
  React.createContext<GlobalContextType>(defaultValue);
