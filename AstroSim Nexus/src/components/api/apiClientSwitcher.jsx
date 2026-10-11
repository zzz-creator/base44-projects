import React from 'react';
import { base44LocalClient } from '../../api/base44-local-client';

// Use environment variable to toggle offline mode
//const OFFLINE = "true";

export const LOCAL_API_URL = 'http://localhost:3001';

export const apiClient = base44LocalClient;

export const ApiClientContext = React.createContext(apiClient);

export const ApiClientProvider = ({ children }) => {
  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
};
