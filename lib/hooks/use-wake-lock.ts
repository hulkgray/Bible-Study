import { useEffect, useRef } from "react";

/**
 * Wake Lock Hook — prevents screen from sleeping during AI streaming.
 * Acquired when active is true, released when active is false.
 */
export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      // Release lock when streaming ends
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    // Acquire the wake lock when streaming starts
    async function acquireLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.debug('[WakeLock] Acquired — screen will stay on during streaming');
          wakeLockRef.current.addEventListener('release', () => {
            console.debug('[WakeLock] Released');
          });
        }
      } catch (err) {
        // Wake Lock can fail if page is not visible or not supported
        console.debug('[WakeLock] Could not acquire:', err);
      }
    }

    acquireLock();

    // Re-acquire if the page becomes visible again (e.g., user switched tabs)
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && active && !wakeLockRef.current) {
        acquireLock();
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [active]);
}
