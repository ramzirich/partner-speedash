import { ENV } from '../config/env';
import { apiRequest } from './client';
import { ApiError } from './errors';

export type UserRole = 'partner' | 'driver' | 'admin';
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

/** POST /api/refresh rotates the whole pair — new access AND refresh token. */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface ForgotPasswordResponse {
  sentTo: string;
}

export interface RequestOtpResponse {
  sentTo: string;
  expiresInSec: number;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

const MOCK_LATENCY_MS = 7000;

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const MOCK_OTP = '123456';
const OTP_TTL_SEC = 120;

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  return `${name.charAt(0)}***@${domain ?? 'starlake.ai'}`;
};

// --- Public API -------------------------------------------------------------

export const authApi = {
  async signIn(payload: SignInRequest): Promise<SignInResponse> {
    return apiRequest<SignInResponse>('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiRequest<RefreshResponse>('/api/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken } satisfies RefreshRequest),
      skipAuth: true,
    });
  },

  async logout(payload: LogoutRequest): Promise<LogoutResponse> {
    return apiRequest<LogoutResponse>('/api/logout', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: payload.refreshToken,
        allDevices: payload.allDevices ?? false,
      }),
    });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    if (ENV.useMockApi) {
      await delay(MOCK_LATENCY_MS);
      if (!email) {
        throw new ApiError('UNKNOWN', 'Missing email', {
          userMessage: 'Please enter the email tied to your account.',
        });
      }
      return { sentTo: maskEmail(email) };
    }

    return apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async requestOtp(email: string): Promise<RequestOtpResponse> {
    if (ENV.useMockApi) {
      await delay(MOCK_LATENCY_MS);
      if (!email) {
        throw new ApiError('UNKNOWN', 'Missing email', {
          userMessage: 'Please enter the email tied to your account.',
        });
      }
      return { sentTo: maskEmail(email), expiresInSec: OTP_TTL_SEC };
    }

    return apiRequest<RequestOtpResponse>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Step 2 of the reset flow: verify the code the driver typed. On success the
   * caller moves on to the home screen (demo) or a set-new-password step.
   */
  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    if (ENV.useMockApi) {
      await delay(MOCK_LATENCY_MS);
      if (payload.code.length < MOCK_OTP.length) {
        throw new ApiError('UNKNOWN', 'Incomplete code', {
          userMessage: `Enter the ${MOCK_OTP.length}-digit code we sent you.`,
        });
      }
      if (payload.code !== MOCK_OTP) {
        throw new ApiError('UNAUTHORIZED', 'Bad OTP', {
          status: 401,
          userMessage: 'That code is incorrect or has expired. Try again.',
        });
      }
      return { resetToken: 'mock-reset-token' };
    }

    return apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

/** Digits expected in the OTP input (mock + UI share this single source). */
export const OTP_LENGTH = MOCK_OTP.length;
