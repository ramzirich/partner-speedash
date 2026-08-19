import { useCallback, useEffect, useState } from 'react';
import { toApiError, zonesApi } from '../api';
import type { ZoneDocument } from '../api';
import { useIsMounted } from './useIsMounted';

let cachedZones: ZoneDocument[] | null = null;
let inFlight: Promise<ZoneDocument[]> | null = null;

let generation = 0;
const listeners = new Set<() => void>();

const loadZones = (): Promise<ZoneDocument[]> => {
  if (cachedZones) {
    return Promise.resolve(cachedZones);
  }
  if (!inFlight) {
    const requestGeneration = generation;
    inFlight = zonesApi
      .getDropoff()
      .then(zones => {
        if (requestGeneration === generation) {
          cachedZones = zones;
        }
        return zones;
      })
      .finally(() => {
        if (requestGeneration === generation) {
          inFlight = null;
        }
      });
  }
  return inFlight;
};

const invalidate = (): void => {
  generation += 1;
  cachedZones = null;
  inFlight = null;
};

export const refreshDropoffZones = async (): Promise<void> => {
  invalidate();
  listeners.forEach(listener => listener());
  try {
    await loadZones();
  } catch {}
};

export interface DropoffZonesState {
  zones: ZoneDocument[];
  loading: boolean;
  error: string;
  reload: () => void;
}

export const useDropoffZones = (): DropoffZonesState => {
  const isMounted = useIsMounted();
  const [zones, setZones] = useState<ZoneDocument[]>(cachedZones ?? []);
  const [loading, setLoading] = useState(!cachedZones);
  const [error, setError] = useState('');

  const fetchZones = useCallback((): void => {
    setLoading(true);
    setError('');
    loadZones()
      .then(next => {
        if (isMounted()) {
          setZones(next);
        }
      })
      .catch(cause => {
        if (isMounted()) {
          setError(toApiError(cause).userMessage);
        }
      })
      .finally(() => {
        if (isMounted()) {
          setLoading(false);
        }
      });
  }, [isMounted]);

  useEffect(() => {
    if (cachedZones) {
      return;
    }
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    listeners.add(fetchZones);
    return () => {
      listeners.delete(fetchZones);
    };
  }, [fetchZones]);

  const reload = useCallback((): void => {
    invalidate();
    fetchZones();
  }, [fetchZones]);

  return { zones, loading, error, reload };
};
