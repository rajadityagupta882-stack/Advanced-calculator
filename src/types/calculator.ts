export type CalculatorMode =
  | 'scientific'
  | 'graphing'
  | 'programmer'
  | 'matrix'
  | 'converter'
  | 'financial'
  | 'statistics';

export interface HistoryItem {
  id: string;
  timestamp: number;
  expression: string;
  result: string;
  numericResult?: number;
  mode: string;
}

export interface MemoryStore {
  M: number;
  vars: Record<string, number>;
}
