import React from 'react';
import { LoginMethod, LoginInfo } from '../types';


export type GlobalContextType = {
  loginInfo?: LoginInfo,
  login?: (loginInfo: LoginInfo) => void
  logout?: () => void
}

export const defaultValue = {
};
 
export const GlobalContext = React.createContext<GlobalContextType>(defaultValue);