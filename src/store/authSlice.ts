import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, RefreshResponse, SignInResponse } from '../api';
import type { StoredSession } from '../api/sessionStorage';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  refreshTokenExpiresAt: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<SignInResponse>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.refreshTokenExpiresAt = action.payload.refreshTokenExpiresAt;
    },
    /**
     * Rotated tokens from POST /api/refresh. Keeps `user` (refresh doesn't
     * return it) and swaps in the fresh access + refresh token pair.
     */
    sessionRefreshed: (state, action: PayloadAction<RefreshResponse>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.refreshTokenExpiresAt = action.payload.refreshTokenExpiresAt;
    },
    sessionRestored: (state, action: PayloadAction<StoredSession | null>) => {
      state.hydrated = true;
      if (!action.payload) {
        return;
      }
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.refreshTokenExpiresAt = action.payload.refreshTokenExpiresAt;
    },
    logout: () => ({ ...initialState, hydrated: true }),
  },
});

export const { setCredentials, sessionRefreshed, sessionRestored, logout } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
