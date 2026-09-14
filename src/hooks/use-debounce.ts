import { useState, useEffect } from "react";

/**
 * useDebounce hook
 * Debounces any fast-changing value (e.g. search inputs, keystrokes)
 * to prevent unnecessary computations and re-renders.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
