import { configureStore } from '@reduxjs/toolkit';
import {
  setAccessToken,
  setRefreshToken,
  setSessionRefreshedHandler,
  setAuthClearedHandler,
} from '../api/authToken';
import { authReducer, logout, sessionRefreshed } from './authSlice';

/**
 * Single app store. Add feature reducers to the `reducer` map as the app grows.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// --- Auth <-> API bridge ----------------------------------------------------
// Redux is the source of truth; the API layer (`apiRequest`) can't read hooks,
// so we (a) mirror the tokens into its non-React holder on every change and
// (b) register how the refresh-on-401 flow writes back into Redux. This is the
// only place the store and the auth API are stitched together.

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

// Persist a successful refresh (rotated pair) and end the session on failure.
setSessionRefreshedHandler(session => store.dispatch(sessionRefreshed(session)));
setAuthClearedHandler(() => store.dispatch(logout()));

export { setCredentials, sessionRefreshed, logout } from './authSlice';
export type { AuthState } from './authSlice';
export { useAppDispatch, useAppSelector } from './hooks';
