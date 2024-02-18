import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: (event: MouseEvent) => void,
): void {
  const handleClick = (event: MouseEvent) => {
    const el = ref.current;

    if (!el || el.contains(event.target as Node)) {
      return;
    }

    callback(event);
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  });
}
