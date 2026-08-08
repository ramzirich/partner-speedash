import { useEffect, useState } from 'react';

/**
 * Seconds left until `expiresAt` (epoch ms), ticking once per second, or null
 * when there's no deadline. The interval is cleared on unmount and as soon as it
 * hits zero, so no timer outlives the banner (§5).
 */
const remaining = (expiresAt: number | null | undefined): number | null =>
  expiresAt == null
    ? null
    : Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));

export const useOfferCountdown = (
  expiresAt: number | null | undefined,
): number | null => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    remaining(expiresAt),
  );

  useEffect(() => {
    setSecondsLeft(remaining(expiresAt));
    if (expiresAt == null) {
      return;
    }
    const id = setInterval(() => {
      const next = remaining(expiresAt);
      setSecondsLeft(next);
      if (next !== null && next <= 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return secondsLeft;
};
