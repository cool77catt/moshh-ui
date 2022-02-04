import React from 'react';
// import {FirebaseAuthTypes} from '@react-native-firebase/auth';
// import { LoginMethodType, LoginInfo } from '../types';

export type GlobalContextType = {
  signOutUser?: () => void;
  // currentUser?: FirebaseAuthTypes.User | null;
  // setCurrentUser?: (user: FirebaseAuthTypes.User | null) => void;
  // loginInfo?: LoginInfo,
  // login?: (loginInfo: LoginInfo) => void
  // logout?: () => void
};

export const defaultValue = {};

export const GlobalContext =
  React.createContext<GlobalContextType>(defaultValue);
