export const SUPPORTED_LOCALES = ["th", "en", "zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
