export type LogCategory = 'LIFECYCLE' | 'RESIZE_EVENT' | 'GC_DIAGNOSTIC' | 'SYSTEM';

export interface LogEntry {
  id: number;
  timestamp: string;
  category: LogCategory;
  source: string;
  message: string;
  isZombie?: boolean;
}
