import { useCallback, useEffect, useRef, useState } from 'react';
import { driversApi, toApiError } from '../api';
import type { WorkStatus } from '../api';
import { useIsMounted } from './useIsMounted';

export interface DriverWorkStatus {
  status: WorkStatus;
  pending: boolean;
  error: string | null;
  setOnline: (online: boolean) => void;
}


export const useWorkStatus = (): DriverWorkStatus => {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState<WorkStatus>('OFFLINE');
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const run = useCallback(
    async (call: () => Promise<WorkStatus>): Promise<void> => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setPending(true);
      const isCurrent = (): boolean =>
        requestId === requestRef.current && isMounted();
      try {
        const next = await call();
        if (isCurrent()) {
          setStatus(next);
          setError(null);
        }
      } catch (err) {
        if (isCurrent()) {
          setError(toApiError(err).userMessage);
        }
      } finally {
        if (isCurrent()) {
          setPending(false);
        }
      }
    },
    [isMounted],
  );

  useEffect(() => {
    run(() => driversApi.getWorkStatus());
  }, [run]);

  const setOnline = useCallback(
    (online: boolean): void => {
      run(() => driversApi.setWorkStatus(online ? 'ONLINE' : 'OFFLINE'));
    },
    [run],
  );

  return { status, pending, error, setOnline };
};
