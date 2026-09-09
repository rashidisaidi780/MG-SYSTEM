import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const storageVersion = 'real-data-v1';

const clearSeededData = () => {
  try {
    if (localStorage.getItem('mg_storage_version') === storageVersion) return;
    Object.keys(localStorage)
      .filter((key) => key.startsWith('mg_') && key !== 'mg_user')
      .forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('mg_storage_version', storageVersion);
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }
};

export function usePersistentState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      clearSeededData();
      const stored = localStorage.getItem(`mg_${key}`);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`mg_${key}`, JSON.stringify(value));
    } catch {
      // Storage may be unavailable in private browsing or restricted environments.
    }
  }, [key, value]);

  return [value, setValue];
}