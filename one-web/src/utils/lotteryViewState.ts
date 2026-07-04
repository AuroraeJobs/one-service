import { useEffect, useMemo, useRef } from 'react';

export const lotteryViewStateKeys = {
  predictionHistory: 'one:lottery:view:prediction-history:v1',
  tickets: 'one:lottery:view:tickets:v1',
  syncOperations: 'one:lottery:view:sync-operations:v1'
} as const;

interface SavedLotteryViewState {
  query: string;
  updatedAt: number;
}

type SetSearchParams = (nextInit: URLSearchParams, navigateOptions?: { replace?: boolean }) => void;

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const hasSearchParams = (searchParams: URLSearchParams) => Array.from(searchParams.keys()).length > 0;

const sanitizeSearchParams = (searchParams: URLSearchParams, allowedKeys: Set<string>) => {
  const next = new URLSearchParams();
  allowedKeys.forEach(key => {
    searchParams.getAll(key).forEach(value => {
      if (value.trim()) {
        next.append(key, value);
      }
    });
  });
  return next;
};

const readSavedQuery = (storageKey: string) => {
  if (!canUseStorage()) {
    return '';
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return '';
    }
    const parsed = JSON.parse(raw) as Partial<SavedLotteryViewState>;
    return typeof parsed.query === 'string' ? parsed.query : '';
  } catch {
    window.localStorage.removeItem(storageKey);
    return '';
  }
};

const writeSavedQuery = (storageKey: string, query: string) => {
  if (!canUseStorage()) {
    return;
  }
  if (!query) {
    window.localStorage.removeItem(storageKey);
    return;
  }
  const payload: SavedLotteryViewState = {
    query,
    updatedAt: Date.now()
  };
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

export const getLotterySavedViewPath = (path: string, storageKey: string) => {
  const query = readSavedQuery(storageKey);
  return query ? `${path}?${query}` : path;
};

export const useLotterySavedViewState = (
  storageKey: string,
  searchParams: URLSearchParams,
  setSearchParams: SetSearchParams,
  allowedKeys: string[]
) => {
  const didRestoreRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const allowedKeySignature = allowedKeys.join('|');
  const allowedKeySet = useMemo(() => new Set(allowedKeys), [allowedKeySignature]);

  useEffect(() => {
    if (didRestoreRef.current) {
      return;
    }
    didRestoreRef.current = true;
    if (hasSearchParams(searchParams)) {
      return;
    }
    const savedQuery = readSavedQuery(storageKey);
    if (!savedQuery) {
      return;
    }
    skipNextSaveRef.current = true;
    setSearchParams(new URLSearchParams(savedQuery), { replace: true });
  }, [searchParams, setSearchParams, storageKey]);

  useEffect(() => {
    if (!didRestoreRef.current) {
      return;
    }
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const sanitized = sanitizeSearchParams(searchParams, allowedKeySet);
    writeSavedQuery(storageKey, sanitized.toString());
  }, [allowedKeySet, searchParams, storageKey]);
};
