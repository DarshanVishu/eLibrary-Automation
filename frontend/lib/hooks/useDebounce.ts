import { useEffect, useState } from 'react';

/**
 * A custom hook that delays updating a value by the specified delay in milliseconds.
 * This is incredibly useful for text inputs to prevent massive re-renders and
 * heavy filtering loops on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the debounced value after the specified delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // If the value changes before the delay passes, this cleanup function
    // runs and clears the timer, effectively "canceling" the previous update.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}
