import { apiRequest } from './client';
import { ApiError } from './errors';

export interface ApiCustomerLocation {
  coordinates?: [number, number];
  description?: string;
  zoneId?: string;
  googleMapsLink?: string;
}

export interface FindCustomerResponse {
  _id?: string;
  phoneNumber?: string;
  name?: string;
  locations?: ApiCustomerLocation[];
}

export interface CustomerAddress {
  description: string;
  googleMapsLink: string;
  zoneId: string;
}

export interface CustomerLookup {
  name: string;
  addresses: CustomerAddress[];
}

const pickPayload = (res: unknown): FindCustomerResponse | null => {
  if (!res || typeof res !== 'object') {
    return null;
  }
  const record = res as Record<string, unknown>;
  const inner = record.data ?? record.customer ?? record;
  if (!inner || typeof inner !== 'object') {
    return null;
  }
  return inner as FindCustomerResponse;
};

const toText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const toAddresses = (locations: unknown): CustomerAddress[] => {
  if (!Array.isArray(locations)) {
    return [];
  }
  return locations
    .filter(
      (location): location is ApiCustomerLocation =>
        typeof location === 'object' && location !== null,
    )
    .map(location => ({
      description: toText(location.description),
      googleMapsLink: toText(location.googleMapsLink),
      zoneId: toText(location.zoneId),
    }))
    .filter(address => address.description !== '');
};

const toLookup = (
  payload: FindCustomerResponse | null,
): CustomerLookup | null => {
  if (!payload) {
    return null;
  }
  const name = toText(payload.name);
  const addresses = toAddresses(payload.locations);

  if (!name && addresses.length === 0) {
    return null;
  }
  return { name, addresses };
};

const customerUrl = (phoneNumber: string): string =>
  `/api/customers/${encodeURIComponent(phoneNumber.replace(/\s/g, ''))}`;

export const customersApi = {
  async find(phoneNumber: string): Promise<CustomerLookup | null> {
    try {
      const res = await apiRequest<unknown>(customerUrl(phoneNumber), {
        method: 'GET',
      });
      return toLookup(pickPayload(res));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  },
};
