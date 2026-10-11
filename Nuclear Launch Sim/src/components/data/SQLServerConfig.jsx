/**
 * Local Configuration
 * 
 * This module provides configuration for the simulator when running
 * in full local mode.
 */

export const SIMULATOR_CONFIG = {
  appName: 'Nuclear Launch Sim',
  version: '1.0.0',
  storageKey: 'StrategicCommandSimulator'
};

// Connection string format (legacy reference)
export const getConnectionString = () => {
  return `Local Storage: ${SIMULATOR_CONFIG.storageKey}`;
};