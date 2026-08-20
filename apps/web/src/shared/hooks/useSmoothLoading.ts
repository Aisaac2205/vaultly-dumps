import { useState, useEffect, useRef } from "react";

export interface SmoothLoadingOptions {
  /** Minimum duration in milliseconds the loader should remain visible to prevent visual stuttering (default: 350ms). */
  minDuration?: number;
}

/**
 * Ensures that loading state does not abruptly flicker or stutter on fast responses.
 * If a request resolves in < minDuration ms, it preserves the loading state until minDuration
 * has elapsed so the animation finishes its cycle gracefully before cross-fading into content.
 */
export function useSmoothLoading(
  isLoading: boolean,
  options?: SmoothLoadingOptions,
): boolean {
  const minDuration = options?.minDuration ?? 350;
  const [active, setActive] = useState(isLoading);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isLoading) {
      startTimeRef.current = performance.now();
      timer = setTimeout(() => {
        setActive(true);
      }, 0);
    } else if (startTimeRef.current !== null) {
      const elapsed = performance.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      timer = setTimeout(() => {
        setActive(false);
        startTimeRef.current = null;
      }, remaining);
    } else {
      timer = setTimeout(() => {
        setActive(false);
      }, 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, minDuration]);

  return isLoading || active;
}
