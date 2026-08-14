import { configureStore } from '@reduxjs/toolkit';
import {
  setAccessToken,
  setRefreshToken,
  setSessionRefreshedHandler,
  setAuthClearedHandler,
} from '../api/authToken';
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from '../api/sessionStorage';
import { clearOrderStatusTimes } from '../services/orderStatusTimes';
import {
  authReducer,
  logout,
  sessionRefreshed,
  sessionRestored,
} from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


let lastAccessToken = store.getState().auth.accessToken;
let lastRefreshToken = store.getState().auth.refreshToken;
setAccessToken(lastAccessToken);
setRefreshToken(lastRefreshToken);

store.subscribe(() => {
  const { accessToken, refreshToken } = store.getState().auth;
  if (accessToken !== lastAccessToken) {
    lastAccessToken = accessToken;
    setAccessToken(accessToken);
  }
  if (refreshToken !== lastRefreshToken) {
    lastRefreshToken = refreshToken;
    setRefreshToken(refreshToken);
  }
});

setSessionRefreshedHandler(session => store.dispatch(sessionRefreshed(session)));
setAuthClearedHandler(() => store.dispatch(logout()));


const toStoredSession = (state: RootState): StoredSession | null => {
  const { user, accessToken, refreshToken, refreshTokenExpiresAt } = state.auth;
  if (!user || !accessToken || !refreshToken || !refreshTokenExpiresAt) {
    return null;
  }
  return { user, accessToken, refreshToken, refreshTokenExpiresAt };
};

let lastPersisted: string | null = null;

store.subscribe(() => {
  if (!store.getState().auth.hydrated) {
    return;
  }
  const session = toStoredSession(store.getState());
  const next = session ? JSON.stringify(session) : null;
  if (next === lastPersisted) {
    return;
  }
  lastPersisted = next;
  if (session) {
    saveSession(session);
  } else {
    clearSession();
    clearOrderStatusTimes();
  }
});

export const restoreSession = async (): Promise<void> => {
  let session: StoredSession | null = null;
  try {
    session = await loadSession();
  } catch {
    // `loadSession` already swallows its own failures, so this only catches
    // something truly unexpected. Falling through to dispatch matters more
    // than the reason does: without it `hydrated` never flips and the splash
    // stays up forever.
  }
  if (session) {
    lastPersisted = JSON.stringify(session);
  }
  store.dispatch(sessionRestored(session));
};

export {
  setCredentials,
  sessionRefreshed,
  sessionRestored,
  logout,
} from './authSlice';
export type { AuthState } from './authSlice';
export { useAppDispatch, useAppSelector } from './hooks';
