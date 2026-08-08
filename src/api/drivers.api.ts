import { apiRequest } from './client';

export type WorkStatus = 'ONLINE' | 'OFFLINE';

export interface WorkStatusResponse {
  success: boolean;
  workStatus: WorkStatus;
}

export interface SetWorkStatusRequest {
  workStatus: WorkStatus;
}

const WORK_STATUS_PATH = '/api/drivers/work-status';

const WORK_STATUSES: ReadonlySet<string> = new Set<WorkStatus>([
  'ONLINE',
  'OFFLINE',
]);

const toWorkStatus = (value: unknown, fallback: WorkStatus): WorkStatus => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim().toUpperCase();
  return WORK_STATUSES.has(normalized) ? (normalized as WorkStatus) : 'OFFLINE';
};

export const isOnline = (status: WorkStatus): boolean => status === 'ONLINE';

export const driversApi = {
  async getWorkStatus(): Promise<WorkStatus> {
    const res = await apiRequest<WorkStatusResponse>(WORK_STATUS_PATH, {
      method: 'GET',
    });
    return toWorkStatus(res?.workStatus, 'OFFLINE');
  },

  async setWorkStatus(workStatus: WorkStatus): Promise<WorkStatus> {
    const res = await apiRequest<WorkStatusResponse>(WORK_STATUS_PATH, {
      method: 'PATCH',
      body: JSON.stringify({ workStatus } satisfies SetWorkStatusRequest),
    });
    return toWorkStatus(res?.workStatus, workStatus);
  },
};
