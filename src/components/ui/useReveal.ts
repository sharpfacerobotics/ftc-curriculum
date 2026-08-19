import {useEffect, useRef, useState} from 'react';
import {usePrefersReducedMotion} from '@site/src/components/mechanical/useAnimation';

/**
 * Reveals an element the first time it scrolls into view.
 *
 * Entrance animation is decoration, so it is skipped entirely under reduced
 * motion and the element simply starts visible. The observer disconnects after
 * the first reveal: re-animating on every scroll past is distracting.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: {threshold?: number; rootMargin?: string} = {},
): {ref: React.RefObject<T | null>; revealed: boolean} {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduced) {
      setRevealed(true);
      return undefined;
    }
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      {threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? '0px 0px -8% 0px'},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced, options.threshold, options.rootMargin]);

  return {ref, revealed};
}

/**
 * Counts from zero to a target once visible.
 *
 * Used for the homepage statistics, where the number climbing draws the eye to
 * a figure that would otherwise be read past. Non-numeric stats skip this.
 */
export function useCountUp(
  target: number,
  {durationMs = 900, start = false}: {durationMs?: number; start?: boolean} = {},
): number {
  const reduced = usePrefersReducedMotion();
  // Initialised to the target so server rendered HTML carries the real figure.
  // A visitor without JavaScript, and any crawler, sees the number rather than
  // a zero that never animates.
  const [value, setValue] = useState(target);
  const frame = useRef<number | null>(null);
  const mountedAt = useRef<number>(0);
  const hasRun = useRef(false);

  useEffect(() => {
    mountedAt.current = typeof performance !== 'undefined' ? performance.now() : 0;
  }, []);

  useEffect(() => {
    if (reduced || !start || hasRun.current) return undefined;

    // If the element was already on screen at mount, the observer fires almost
    // immediately. Counting up then would mean visibly resetting a number the
    // visitor has already read, so it is left alone.
    const elapsed =
      (typeof performance !== 'undefined' ? performance.now() : 0) - mountedAt.current;
    if (elapsed < 250) {
      hasRun.current = true;
      setValue(target);
      return undefined;
    }

    hasRun.current = true;
    let startedAt = 0;
    setValue(0);

    function step(now: number) {
      if (!startedAt) startedAt = now;
      const progress = Math.min((now - startedAt) / durationMs, 1);
      // Ease out so the number decelerates into place.
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    }

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, start, reduced]);

  return value;
}
