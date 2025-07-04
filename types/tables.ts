export interface Column<T = any> {
  key: string;
  label: string;
  class?: string | ((item: T) => string[]);
  // class?: string;
  format?: (row: T, index?: number) => string;
}

export interface TableItem {
  [key: string]: any;
  status?: string;
  isBlocked?: boolean;
}
