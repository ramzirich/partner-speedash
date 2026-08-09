import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '../api';

/**
 * Owns the lifetime of the Socket.IO connection.
 *
 * The socket exists for exactly as long as a driver is signed in. Signed out
 * there is nothing to receive — the dispatcher has no one to offer work to — and
 * nothing to send, so holding a reconnecting websocket open would only burn
 * battery.
 *
 * Everything else *uses* the connection but never opens or closes it:
 * `useDriverOffers` subscribes to it, `emitDriverLocation` writes to it when it
 * happens to be up. Keeping that authority in one place is what makes "signed in
 * → connected, signed out → disconnected" true by construction rather than a
 * rule every caller has to remember.
 */
export const useDriverSocket = (driverId: string | undefined): void => {
  useEffect(() => {
    if (!driverId) {
      // Covers the first render of a signed-out session; a disconnect with no
      // socket is a no-op.
      disconnectSocket();
      return;
    }
    connectSocket();
    // Sign-out unmounts the screen (`navigation.reset('Landing')`), so this
    // cleanup is also the sign-out teardown — the next driver to sign in can
    // never inherit this driver's socket or its subscriptions. Keyed on
    // `driverId`, so an account switch redials rather than reusing it.
    return () => disconnectSocket();
  }, [driverId]);
};
