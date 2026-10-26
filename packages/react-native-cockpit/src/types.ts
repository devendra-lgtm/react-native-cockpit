export type NetworkMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' | string;

export interface NetworkRequest {
  id: string;
  url: string;
  method: NetworkMethod;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseType?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
  size?: number;
}

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface ConsoleLog {
  id: string;
  level: LogLevel;
  timestamp: number;
  messages: any[];
  stack?: string;
}

export interface StorageAdapter {
  name: string;
  getAllKeys: () => Promise<string[]> | string[];
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem?: (key: string, value: string) => Promise<void> | void;
  removeItem?: (key: string) => Promise<void> | void;
  clear?: () => Promise<void> | void;
}

export interface StorageItem {
  key: string;
  value: string | null;
  parsedJson?: any;
}

export type CockpitTab = 'network' | 'logs' | 'storage' | 'info';

export interface CockpitConfig {
  enabled?: boolean;
  maxNetworkRequests?: number;
  maxLogs?: number;
  storageAdapters?: StorageAdapter[];
  bubbleInitialPosition?: { x: number; y: number };
  autoOpenOnError?: boolean;
  customShakeDetector?: boolean;
}
