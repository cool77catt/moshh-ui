import React from 'react';
import {UserDbRecordType} from '../utils/firestoreDb';

export type GlobalContextType = {
  userInfo?: UserDbRecordType | null;
  setUserInfo?: (record: UserDbRecordType) => void;
  signOutUser?: () => void;
};

export const defaultValue = {};

export const GlobalContext =
  React.createContext<GlobalContextType>(defaultValue);
