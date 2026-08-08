import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../api';
import type { WorkStatus } from '../api';

/**
 * Owns the lifetime of the Socket.IO connection.
 *
 * The socket is a duty-hours channel: it exists only while a signed-in driver is
 * ONLINE. Off duty there is nothing to receive — the dispatcher won't offer work
 * to an offline driver — and nothing to send, so holding a reconnecting
 * websocket open would only burn battery and keep the driver looking reachable.
 *
 * Everything else *uses* the connection but never opens or closes it:
 * `useDriverOffers` subscribes to it, `emitDriverLocation` writes to it when it
 * happens to be up. Keeping that authority in one place is what makes "online →
 * connected, offline or signed out → disconnected" true by construction rather
 * than a rule every caller has to remember.
 *
 * Returns whether the driver is on duty — the same condition consumers gate
 * themselves on, so they can't disagree with the connection about it.
 */
export const useDriverSocket = (
  driverId: string | undefined,
  workStatus: WorkStatus,
): boolean => {
  const online = Boolean(driverId) && workStatus === 'ONLINE';

  useEffect(() => {
    if (!driverId || workStatus !== 'ONLINE') {
      // Covers going off duty and the first render of an off-duty session; a
      // disconnect with no socket is a no-op.
      disconnectSocket();
      return;
    }
    connectSocket();
    // Sign-out unmounts the screen (`navigation.reset('Landing')`), so this
    // cleanup is also the sign-out teardown — the next driver to sign in can
    // never inherit this driver's socket or its subscriptions. Keyed on
    // `driverId` too, so an account switch redials rather than reusing it.
    return () => disconnectSocket();
  }, [driverId, workStatus]);

  return online;
};
