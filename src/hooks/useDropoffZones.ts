import { useCallback, useEffect, useState } from 'react';
import { toApiError, zonesApi } from '../api';
import type { ZoneDocument } from '../api';
import { useIsMounted } from './useIsMounted';

let cachedZones: ZoneDocument[] | null = null;
let inFlight: Promise<ZoneDocument[]> | null = null;

const loadZones = (): Promise<ZoneDocument[]> => {
  if (cachedZones) {
    return Promise.resolve(cachedZones);
  }
  if (!inFlight) {
    inFlight = zonesApi
      .getDropoff()
      .then(zones => {
        cachedZones = zones;
        return zones;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
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

  const reload = useCallback((): void => {
    cachedZones = null;
    fetchZones();
  }, [fetchZones]);

  return { zones, loading, error, reload };
};
