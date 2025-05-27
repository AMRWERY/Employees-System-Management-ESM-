export interface I18nTypes {
  t: (key: string, params?: Record<string, any>) => string;
  setLocale: (locale: string) => void;
}
