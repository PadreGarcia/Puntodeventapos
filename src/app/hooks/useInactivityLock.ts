import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInactivityLockOptions {
  timeout: number; // minutos
  onLock: () => void;
  enabled: boolean;
}

export function useInactivityLock({ timeout, onLock, enabled }: UseInactivityLockOptions) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) return;

    // Revisar inactividad cada 10 segundos
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const inactiveTime = (now - lastActivity) / 1000 / 60; // minutos

      if (inactiveTime >= timeout) {
        onLock();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, 10000); // cada 10 segundos

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, timeout, lastActivity, onLock]);

  return { lastActivity, resetTimer };
}
