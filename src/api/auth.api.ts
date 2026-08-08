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

export const OTP_LENGTH = 6;

export interface LogoutRequest {
  refreshToken: string;
  allDevices?: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  return `${name.charAt(0)}***@${domain ?? 'gmail.com'}`;
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

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {//TODO
    if (ENV.useMockApi) {
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

  //TODO: all otp
  async requestOtp(email: string): Promise<RequestOtpResponse> {//TODO
    if (ENV.useMockApi) {
      if (!email) {
        throw new ApiError('UNKNOWN', 'Missing email', {
          userMessage: 'Please enter the email tied to your account.',
        });
      }
      return { sentTo: maskEmail(email), expiresInSec: 120 };
    }

    return apiRequest<RequestOtpResponse>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    if (ENV.useMockApi) {
      return { resetToken: 'mock-reset-token' };
    }

    return apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
