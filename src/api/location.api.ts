import { apiRequest } from './client';

export interface ReportLocationRequest {
  driverId: string;
  latitude: number;
  longitude: number;
}

export interface ReportLocationResponse {
  success: boolean;
  latitude: number;
  longitude: number;
}

export const locationApi = {//TODO: remove mock
  async report(
    payload: ReportLocationRequest,
  ): Promise<ReportLocationResponse> {
    if (true) {

      return {
        success: true,
        latitude: payload.latitude,
        longitude: payload.longitude,
      };
    }
    return apiRequest<ReportLocationResponse>('/api/driver/location', {
      method: 'POST',
      body: JSON.stringify({
        driverId: payload.driverId,
        latitude: payload.latitude,
        longitude: payload.longitude,
      } satisfies ReportLocationRequest),
    });
  },
};
