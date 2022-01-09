import React from 'react';

export type GlobalContextType = {
  email: string
  login?: (email: string) => void
  logout?: () => void
}

const defaultValue = {
  email: ''
}
 
export const GlobalContext = React.createContext<GlobalContextType>(defaultValue);