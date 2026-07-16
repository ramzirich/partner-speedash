export { apiRequest } from './client';
export {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
} from './authToken';
export { authApi, OTP_LENGTH } from './auth.api';

export {
  ApiError,
  NetworkError,
  TimeoutError,
  toApiError,
} from './errors';
export type { ApiErrorCode } from './errors';
export type {
  UserRole,
  AuthUser,
  SignInRequest,
  SignInResponse,
  RefreshRequest,
  RefreshResponse,
  ForgotPasswordResponse,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  LogoutRequest,
  LogoutResponse,
} from './auth.api';
