export interface Column<T = any> {
  key: keyof T | string;
  label: string;
  class?: string;
  format?: (row: T, index?: number) => string;
}

export interface TableItem {
  [key: string]: any;
  status?: string;
  isBlocked?: boolean;
}
