import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable `isMounted()` getter.
 *
 * Guard async resolutions with it before calling `setState` to avoid the
 * classic "state update on an unmounted component" memory leak when a screen
 * is dismissed while a request is still in flight.
 *
 *   const isMounted = useIsMounted();
 *   const res = await authApi.signIn(...);
 *   if (isMounted()) setData(res);
 */
export const useIsMounted = (): (() => boolean) => {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
};
