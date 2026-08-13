import { apiRequest } from './client';

/**
 * Device registration for server-sent push.
 *
 * A socket only reaches the app while its JS runtime is alive, so an order that
 * moves while the partner is out of the app can't be announced from the client.
 * FCM inverts that: the backend addresses the *device*, and the OS wakes the app
 * (or just shows the notification) even from a cold, force-closed state. These
 * two calls are how the backend learns which devices belong to this partner.
 *
 * Both are authenticated — the backend ties the token to the caller's identity
 * from the Bearer token, never to an id in the body.
 */

export type DevicePlatform = 'android' | 'ios';

export interface RegisterDeviceRequest {
  /** The FCM registration token for this install. */
  token: string;
  platform: DevicePlatform;
}

export interface UnregisterDeviceRequest {
  token: string;
}

export interface DeviceResponse {
  success: boolean;
}

export const devicesApi = {
  async register(payload: RegisterDeviceRequest): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async unregister(payload: UnregisterDeviceRequest): Promise<DeviceResponse> {
    return apiRequest<DeviceResponse>('/api/devices/unregister', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
