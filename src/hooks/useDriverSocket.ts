import { useEffect } from 'react';
import { acquireSocket, disconnectSocket, releaseSocket } from '../api';

/**
 * Owns the lifetime of the Socket.IO connection.
 *
 * The socket exists for exactly as long as a partner is signed in. Signed out
 * there is nothing to receive — the backend has no one to notify — and nothing
 * to send, so holding a reconnecting websocket open would only burn battery.
 *
 * Everything else *uses* the connection but never opens or closes it:
 * `useDriverOffers` subscribes to it, `emitDriverLocation` writes to it when it
 * happens to be up. Keeping that authority in one place is what makes "signed in
 * → connected, signed out → disconnected" true by construction rather than a
 * rule every caller has to remember.
 */
export const useDriverSocket = (partnerId: string | undefined): void => {
  useEffect(() => {
    if (!partnerId) {
      // Covers the first render of a signed-out session; a disconnect with no
      // socket is a no-op.
      disconnectSocket();
      return;
    }
    acquireSocket();
    // Sign-out unmounts the screen (`navigation.reset('Landing')`), so this
    // cleanup is also the sign-out teardown — the next partner to sign in can
    // never inherit this partner's socket or its subscriptions. Keyed on
    // `partnerId`, so an account switch redials rather than reusing it.
    return () => releaseSocket();
  }, [partnerId]);
};
