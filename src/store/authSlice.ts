import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, RefreshResponse, SignInResponse } from '../api';

/**
 * Authenticated-session state.
 *
 * Holds the signed-in user plus the tokens returned by POST /api/login. Tokens
 * live here in memory only for now; persisting them securely (react-native-
 * keychain) so the session survives a restart is a separate, planned step.
 */
export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  refreshTokenExpiresAt: null,
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
    logout: () => initialState,
  },
});

export const { setCredentials, sessionRefreshed, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
