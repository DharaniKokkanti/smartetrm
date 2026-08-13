import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

/**
 * Fires `onIdle` after `timeoutSeconds` of no mouse/keyboard/scroll
 * activity. `onIdle` is read through a ref so the effect only re-subscribes
 * when `timeoutSeconds` itself changes (login) — an inline callback that's a
 * new function identity every render would otherwise reset the idle clock
 * on every unrelated re-render (theme toggle, API log entries, etc.),
 * effectively disabling the timeout.
 */
export function useIdleLogout(timeoutSeconds: number, onIdle: () => void) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!timeoutSeconds || timeoutSeconds <= 0) return;

    let timer: ReturnType<typeof setTimeout>;
    function reset() {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutSeconds * 1000);
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [timeoutSeconds]);
}
