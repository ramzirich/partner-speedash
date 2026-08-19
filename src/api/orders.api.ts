import { ENV } from '../config/env';
import { apiRequest } from './client';
import type {
  Order,
  OrderCoordinates,
  OrderPartner,
  OrderProgress,
  OrderStatus,
} from '../components/OrderCard';

export type ApiOrderStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'AT_PICKUP'
  | 'ON_WAY'
  | 'DELIVERED'
  | 'CANCELED'
  | 'DECLINED';

interface ApiAddress {
  street: string;
  city: string;
  country: string;
  fullAddress: string;
}

interface ApiGeoPoint {
  type: 'Point';
  coordinates: [number, number];
}
export interface ApiOrder {
  id: string;
  partnerId: string;
  driverId: string;
  customerId: string;
  status: ApiOrderStatus;
  deliveryFee: string;
  estimatedDistance: number;
  estimatedDuration: number;
  pickupLocation: ApiGeoPoint;
  pickupAddress: ApiAddress;
  dropoffLocation: ApiGeoPoint;
  dropoffAddress: ApiAddress;
  customerPhoneSnapshot: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersListResponse {
  success: boolean;
  data: Array<ApiOrder | OrderDocument>;
  pagination: OrdersPagination;
  range: { from: string; to: string };
}

export interface OrderHistoryRequest {
  startDateUnix: number;
  endDateUnix: number;
}

export interface OrderHistoryResponse {
  success: boolean;
  data: OrderDocument[];
}

export const toDayUnix = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export interface ListOrdersParams {
  from?: string;
  to?: string;
  status?: ApiOrderStatus;
  limit?: number;
  page?: number;
}

const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  'ASSIGNED',
  'AT_PICKUP',
  'ON_WAY',
  'HEADING_TO_PARTNER',
  'HEADING_TO_CUSTOMER',
]);

const NAVIGABLE_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'ASSIGNED',
  'HEADING_TO_PARTNER',
]);

const CONTACTABLE_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'ASSIGNED',
  'HEADING_TO_PARTNER',
  'AT_PICKUP',
  'HEADING_TO_CUSTOMER',
  'ON_WAY',
]);

const CANCELLABLE_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'ASSIGNED',
  'HEADING_TO_PARTNER',
]);

const toProgress = (status: string): OrderProgress | undefined => {
  switch (status) {
    case 'PENDING':
    case 'ASSIGNED':
    case 'HEADING_TO_PARTNER':
    case 'AT_PICKUP':
    case 'HEADING_TO_CUSTOMER':
    case 'DELIVERED':
      return status;
    case 'ON_WAY':
      return 'HEADING_TO_CUSTOMER';
    default:
      return undefined;
  }
};

const toUiStatus = (status: string): OrderStatus => {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'ASSIGNED':
    case 'AT_PICKUP':
    case 'ON_WAY':
    case 'HEADING_TO_PARTNER':
    case 'HEADING_TO_CUSTOMER':
      return 'on_delivery';
    case 'DELIVERED':
      return 'done';
    case 'CANCELED':
    case 'DECLINED':
    case 'REJECTED':
    case 'FAILED':
      return 'rejected';
    default:
      return 'pending';
  }
};

const toAmount = (fee: string): number => {
  const parsed = Number.parseFloat(fee);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toEpochMs = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isLatLng = (latitude: number, longitude: number): boolean =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;

const toOrder = (api: ApiOrder): Order => {
  const [longitude, latitude] = api.pickupLocation?.coordinates ?? [NaN, NaN];
  return {
    id: api.id,
    pickup: api.pickupAddress?.fullAddress ?? '—',
    dropoff: api.dropoffAddress?.fullAddress ?? '—',
    amount: toAmount(api.deliveryFee),
    currency: 'USD',
    status: toUiStatus(api.status),
    progress: toProgress(api.status),
    pickupCoordinates:
      NAVIGABLE_STATUSES.has(api.status) && isLatLng(latitude, longitude)
        ? { latitude, longitude }
        : undefined,
    customerPhone: ACTIVE_STATUSES.has(api.status)
      ? api.customerPhoneSnapshot
      : undefined,
    createdAt: toEpochMs(api.createdAt),
  };
};

export interface Decimal128Json {
  $numberDecimal: string;
}

export interface OrderPlace {
  coordinates?: [number, number];
  googlePlaceId?: string;
  description?: string;
  googleMapsLink?: string;
  zone?: string;
}

export interface OrderParty {
  _id: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phoneNumber?: string;
}

export type OrderDocumentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'HEADING_TO_PARTNER'
  | 'AT_PICKUP'
  | 'HEADING_TO_CUSTOMER'
  | 'DELIVERED'
  | 'CANCELED';

export interface OrderDocument {
  _id: string;
  status: OrderDocumentStatus | string;
  customerPhoneNumber?: string | null;
  driverId?: OrderParty | string | null;
  partnerId?: OrderParty | string | null;
  deliveryFee?: Decimal128Json | string | number | null;
  pickupLocation?: OrderPlace;
  dropoffLocation?: OrderPlace;
  note?: string | null;
  assignedAt?: number | string;
  deliveredAt?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneDocument {
  _id: string;
  name: string;
  type: string;
}

const toDecimalAmount = (
  fee: Decimal128Json | string | number | null | undefined,
): number => {
  if (fee == null) {
    return 0;
  }
  if (typeof fee === 'number') {
    return Number.isFinite(fee) ? fee : 0;
  }
  if (typeof fee === 'string') {
    return toAmount(fee);
  }
  return toAmount(fee.$numberDecimal);
};

const MAPS_QUERY = /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;

const fromMapsLink = (
  link: string | undefined,
): OrderCoordinates | undefined => {
  const match = link?.match(MAPS_QUERY);
  if (!match) {
    return undefined;
  }
  const latitude = Number.parseFloat(match[1]);
  const longitude = Number.parseFloat(match[2]);
  return isLatLng(latitude, longitude) ? { latitude, longitude } : undefined;
};

const toCoordinates = (
  place: OrderPlace | undefined,
): OrderCoordinates | undefined => {
  const fromLink = fromMapsLink(place?.googleMapsLink);
  if (fromLink) {
    return fromLink;
  }
  const coordinates = place?.coordinates;
  if (!coordinates || coordinates.length !== 2) {
    return undefined;
  }
  const [latitude, longitude] = coordinates;
  return isLatLng(latitude, longitude) ? { latitude, longitude } : undefined;
};

const describePlace = (place: OrderPlace | undefined): string => {
  const description = place?.description?.trim();
  if (description) {
    return description;
  }
  const point = toCoordinates(place);
  if (point) {
    return `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
  }
  return '—';
};

const toParty = (
  party: OrderParty | string | null | undefined,
): OrderPartner | undefined => {
  if (!party || typeof party === 'string') {
    return undefined;
  }
  const name =
    party.businessName?.trim() ||
    [party.firstName, party.lastName].filter(Boolean).join(' ').trim();
  if (!name) {
    return undefined;
  }
  return {
    id: party._id,
    name,
    phone: party.phoneNumber?.trim() || undefined,
  };
};

export const fromOrderDocument = (doc: OrderDocument): Order => {
  const partner = toParty(doc.partnerId);
  const contactable = CONTACTABLE_STATUSES.has(doc.status);
  return {
    id: doc._id,
    pickup: describePlace(doc.pickupLocation),
    dropoff: describePlace(doc.dropoffLocation),
    dropoffLink: doc.dropoffLocation?.googleMapsLink?.trim() || undefined,
    amount: toDecimalAmount(doc.deliveryFee),
    currency: 'USD',
    status: toUiStatus(doc.status),
    progress: toProgress(doc.status),
    partner:
      partner && !contactable ? { ...partner, phone: undefined } : partner,
    driver: toParty(doc.driverId),
    pickupCoordinates: NAVIGABLE_STATUSES.has(doc.status)
      ? toCoordinates(doc.pickupLocation)
      : undefined,
    customerPhone: doc.customerPhoneNumber ?? undefined,
    note: doc.note ?? undefined,
    createdAt: toEpochMs(doc.createdAt),
    cancellable: CANCELLABLE_STATUSES.has(doc.status),
  };
};

const fromListItem = (item: ApiOrder | OrderDocument): Order =>
  '_id' in item ? fromOrderDocument(item) : toOrder(item);

const buildQuery = (params: ListOrdersParams): string => {
  const parts: string[] = [];
  const add = (key: string, value: string | number | undefined): void => {
    if (value !== undefined && value !== '') {
      parts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  };
  add('from', params.from);
  add('to', params.to);
  add('status', params.status);
  add('limit', params.limit);
  add('page', params.page);
  return parts.length ? `?${parts.join('&')}` : '';
};

export type OrderStatusUpdate = OrderProgress | 'CANCELED';

export interface UpdateOrderStatusRequest {
  orderId: string;
  partnerId: string;
  newStatus: OrderStatusUpdate;
}

export interface CancelOrderRequest {
  orderId: string;
  partnerId: string;
}

const gatewayUrl = (path: string): string =>
  `${ENV.socketUrl.replace(/\/$/, '')}${path}`;

const httpUrl = (path: string): string => `${ENV.apiBaseUrl}${path}`;

const ordersUrl = (): string => gatewayUrl('/orders');
const zonesUrl = (): string => httpUrl('/api/zones/dropoff');

const statusUrl = (orderId: string): string =>
  gatewayUrl(`/orders/${encodeURIComponent(orderId)}/status`);

const partnerStatusUrl = (orderId: string): string =>
  gatewayUrl(`/orders/${encodeURIComponent(orderId)}/status/partner`);

const isOrderDocumentLike = (value: unknown): value is OrderDocument =>
  typeof value === 'object' &&
  value !== null &&
  (typeof (value as any)._id === 'string' ||
    typeof (value as any).id === 'string');

const patchStatus = async (
  orderId: string,
  newStatus: OrderStatusUpdate,
): Promise<Order | null> => {
  const url =
    newStatus === 'CANCELED' ? partnerStatusUrl(orderId) : statusUrl(orderId);
  const res = await apiRequest<unknown>(url, {
    method: 'PATCH',
    body: JSON.stringify({ newStatus }),
  });
  const doc = pickDocument(res);
  return doc ? fromOrderDocument(doc) : null;
};

const pickDocument = (res: unknown): OrderDocument | undefined => {
  if (isOrderDocumentLike(res)) {
    return res;
  }
  if (typeof res === 'object' && res !== null) {
    const { data, order } = res as { data?: unknown; order?: unknown };
    if (isOrderDocumentLike(data)) {
      return data;
    }
    if (isOrderDocumentLike(order)) {
      return order;
    }
  }
  return undefined;
};

export interface CreateOrderDropoff {
  zoneId: string;
  description: string;
  googleMapsLink: string;
}

export interface CreateOrderRequest {
  customerPhoneNumber: string;
  customerName: string;
  dropoffLocation: CreateOrderDropoff;
  note?: string;
}

const isZoneDocumentLike = (value: unknown): value is ZoneDocument =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ZoneDocument)._id === 'string' &&
  typeof (value as ZoneDocument).name === 'string';

const toDropoffZones = (res: unknown): ZoneDocument[] => {
  const rows =
    Array.isArray(res) || res == null
      ? res
      : (res as { data?: unknown; zones?: unknown }).data ??
        (res as { zones?: unknown }).zones;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .filter(isZoneDocumentLike)
    .filter(zone => zone.type === 'dropoff');
};

export const zonesApi = {
  async getDropoff(): Promise<ZoneDocument[]> {
    const res = await apiRequest<unknown>(zonesUrl(), { method: 'GET' });
    return toDropoffZones(res);
  },
};

export const ordersApi = {
  async create(input: CreateOrderRequest): Promise<OrderDocument | null> {
    const res = await apiRequest<unknown>(ordersUrl(), {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return pickDocument(res) ?? null;
  },

  async list(params: ListOrdersParams = {}): Promise<Order[]> {
    const res = await apiRequest<OrdersListResponse>(
      `/api/orders${buildQuery(params)}`,
      { method: 'GET' },
    );
    return (res.data ?? []).map(fromListItem);
  },

  async historyDocuments(range: OrderHistoryRequest): Promise<OrderDocument[]> {
    const res = await apiRequest<OrderHistoryResponse>('/api/order/history', {
      method: 'POST',
      body: JSON.stringify(range),
    });
    return res.data ?? [];
  },

  async history(range: OrderHistoryRequest): Promise<Order[]> {
    const docs = await ordersApi.historyDocuments(range);
    return docs.map(fromOrderDocument);
  },

  async findById(
    orderId: string,
    range: OrderHistoryRequest,
  ): Promise<OrderDocument | null> {
    const docs = await ordersApi.historyDocuments(range);
    return docs.find(doc => doc._id === orderId) ?? null;
  },

  async cancel({ orderId }: CancelOrderRequest): Promise<Order | null> {
    return patchStatus(orderId, 'CANCELED');
  },

  async updateStatus({
    orderId,
    newStatus,
  }: UpdateOrderStatusRequest): Promise<Order | null> {
    return patchStatus(orderId, newStatus);
  },
};
