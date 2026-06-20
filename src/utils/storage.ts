const STORAGE_KEY = 'sign-language-review-data';

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
    if (stored) {
      return JSON.parse(stored) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

export const clearStorage = (): void => {
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_KEY))
    .forEach(key => localStorage.removeItem(key));
};
