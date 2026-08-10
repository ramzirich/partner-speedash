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
  | 'CANCELLED'
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
  //TODO: fix dropoff type
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

/** 'YYYY-MM-DD' → that calendar day's UTC midnight, in epoch ms. */
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
    // Legacy name for the same leg on the older flattened shape.
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
    case 'CANCELLED':
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

// --- Raw order document (list + socket payloads) -----------------------------

/** Mongoose Decimal128 as it serialises over the wire. */
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
  /** Populated by the list endpoint, a bare id on leaner payloads. */
  driverId?: OrderParty | string | null;
  partnerId?: OrderParty | string | null;
  /** Decimal128 → `{ $numberDecimal: "5" }`, not a number. */
  deliveryFee?: Decimal128Json | string | number | null;
  pickupLocation?: OrderPlace;
  dropoffLocation?: OrderPlace;
  note?: string | null;
  assignedAt?: number | string;
  deliveredAt?: number | string;
  createdAt?: string;
  updatedAt?: string;
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

/** Both link shapes are in the data: `?q=lat,lng` and `?api=1&query=lat,lng`. */
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

/**
 * A populated `partnerId`/`driverId` → the card's contact model. Both sides
 * come back in the same shape: a business name for a partner, a first/last pair
 * for a driver, and a `phoneNumber` on either when the payload carries one.
 * A bare id (unpopulated) has nothing to show, so it maps to undefined.
 */
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

/** Raw order document → the UI card model. */
export const fromOrderDocument = (doc: OrderDocument): Order => {
  const partner = toParty(doc.partnerId);
  const contactable = CONTACTABLE_STATUSES.has(doc.status);
  return {
    id: doc._id,
    pickup: describePlace(doc.pickupLocation),
    dropoff: describePlace(doc.dropoffLocation),
    // Straight off the document: these orders often carry a link and no
    // coordinates, and the link is the only way to see where "hamra" is.
    dropoffLink: doc.dropoffLocation?.googleMapsLink?.trim() || undefined,
    amount: toDecimalAmount(doc.deliveryFee),
    currency: 'USD',
    status: toUiStatus(doc.status),
    progress: toProgress(doc.status),
    // The partner stays named on a closed order; only its number goes away.
    partner:
      partner && !contactable ? { ...partner, phone: undefined } : partner,
    // Whoever is carrying it, once one has been assigned. Their number only
    // appears when the payload populates it.
    driver: toParty(doc.driverId),
    // Only while the pickup is still ahead of the driver — see NAVIGABLE_STATUSES.
    pickupCoordinates: NAVIGABLE_STATUSES.has(doc.status)
      ? toCoordinates(doc.pickupLocation)
      : undefined,
    // It's the partner's own customer, so the number is theirs to see whatever
    // state the order is in.
    customerPhone: doc.customerPhoneNumber ?? undefined,
    note: doc.note ?? undefined,
    createdAt: toEpochMs(doc.createdAt),
    cancellable: CANCELLABLE_STATUSES.has(doc.status),
  };
};

/** Documents and the flattened shape both reach the list — pick the mapper. */
const fromListItem = (item: ApiOrder | OrderDocument): Order =>
  '_id' in item ? fromOrderDocument(item) : toOrder(item);

// --- Mock data (USE_MOCK_API=true) ------------------------------------------

const MOCK_LATENCY_MS = 450;

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const MOCK_ORDERS: OrderDocument[] = [
  {
    _id: '6a6b8e71f88debcaa4c87050',
    status: 'PENDING',
    customerPhoneNumber: '+961 71 220 118',
    partnerId: {
      _id: '6a639e00add566fc8cd0eac2',
      role: 'partner',
      businessName: 'Shawarma House',
      phoneNumber: '+961 1 345 900',
    },
    deliveryFee: { $numberDecimal: '3.5' },
    pickupLocation: { coordinates: [33.782004, 35.479479] },
    dropoffLocation: {
      coordinates: [33.785468, 35.490001],
      description: 'Gemmayze, Rue Gouraud',
    },
    note: 'Two mixed platters — ring the bell twice.',
    createdAt: '2026-07-30T17:48:33.561Z',
    updatedAt: '2026-07-30T17:48:33.561Z',
  },
  {
    _id: '6a6b8e71f88debcaa4c87051',
    status: 'ASSIGNED',
    customerPhoneNumber: '+961 76 884 021',
    partnerId: {
      _id: '6a639e00add566fc8cd0eac3',
      role: 'partner',
      businessName: 'Beirut Burger',
      phoneNumber: '+961 1 780 442',
    },
    deliveryFee: { $numberDecimal: '1' },
    pickupLocation: { coordinates: [33.888907, 35.495479] },
    dropoffLocation: { coordinates: [33.893791, 35.501778] },
    note: 'Customer asked for extra napkins.',
    createdAt: '2026-07-30T16:12:03.100Z',
    updatedAt: '2026-07-30T16:40:11.020Z',
  },
  {
    _id: '6a6b8e71f88debcaa4c87052',
    status: 'HEADING_TO_CUSTOMER',
    customerPhoneNumber: '+961 3 552 907',
    partnerId: {
      _id: '6a639e00add566fc8cd0eac4',
      role: 'partner',
      businessName: 'Sushi Loft',
      phoneNumber: '+961 1 902 118',
    },
    deliveryFee: { $numberDecimal: '4.25' },
    pickupLocation: { coordinates: [33.895011, 35.478213] },
    dropoffLocation: {
      coordinates: [33.901244, 35.512004],
      description: 'Achrafieh, Sassine Square',
    },
    createdAt: '2026-07-30T15:02:44.000Z',
    updatedAt: '2026-07-30T15:44:10.000Z',
  },
  {
    _id: '6a6b8e71f88debcaa4c87053',
    status: 'DELIVERED',
    customerPhoneNumber: '+961 70 118 004',
    partnerId: {
      _id: '6a639e00add566fc8cd0eac5',
      role: 'partner',
      businessName: 'Pizza Roma',
      phoneNumber: '+961 1 640 771',
    },
    deliveryFee: { $numberDecimal: '2' },
    pickupLocation: { coordinates: [33.870112, 35.501903] },
    dropoffLocation: {
      coordinates: [33.876553, 35.516774],
      description: 'Badaro, Rue 45',
    },
    createdAt: '2026-07-30T12:20:00.000Z',
    updatedAt: '2026-07-30T13:05:00.000Z',
  },
  {
    _id: '6a6b8e71f88debcaa4c87054',
    status: 'CANCELED',
    partnerId: {
      _id: '6a639e00add566fc8cd0eac6',
      role: 'partner',
      businessName: 'Falafel Corner',
      phoneNumber: '+961 1 220 553',
    },
    deliveryFee: { $numberDecimal: '1.75' },
    pickupLocation: { coordinates: [33.860221, 35.487114] },
    dropoffLocation: { coordinates: [33.864998, 35.499001] },
    note: 'Customer canceled before pickup.',
    createdAt: '2026-07-30T11:02:00.000Z',
    updatedAt: '2026-07-30T11:14:00.000Z',
  },
];

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

// --- Status transitions ------------------------------------------------------

/** Every status the app can ask for — cancelling is one of them. */
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

/**
 * The `/orders` routes live on the realtime gateway (SOCKET_URL), not the REST
 * host — absolute so `apiRequest` skips its own base URL while still attaching
 * the Bearer header, the timeout and refresh-on-401.
 */
const gatewayUrl = (path: string): string =>
  `${ENV.socketUrl.replace(/\/$/, '')}${path}`;

const ordersUrl = (): string => gatewayUrl('/orders');

const statusUrl = (orderId: string): string =>
  gatewayUrl(`/orders/${encodeURIComponent(orderId)}/status`);

/**
 * The controller returns whatever the service hands back, so the document may
 * arrive bare or wrapped. Treat it as untrusted (§8): dig out something that
 * actually looks like an order, or report none and let the caller refetch.
 */
const isOrderDocumentLike = (value: unknown): value is OrderDocument =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as OrderDocument)._id === 'string';

/**
 * `PATCH /orders/:id/status` with `{ partnerId, newStatus }`. `apiRequest`
 * attaches the `Authorization: Bearer <accessToken>` header, the timeout and
 * the refresh-on-401 retry. Both the status move and the cancellation go
 * through here — they're the same call with a different target status.
 */
const patchStatus = async (
  orderId: string,
  partnerId: string,
  newStatus: OrderStatusUpdate,
): Promise<Order | null> => {
  if (ENV.useMockApi) {
    await delay(MOCK_LATENCY_MS);
    const doc = MOCK_ORDERS.find(order => order._id === orderId);
    if (!doc) {
      return null;
    }
    // Mutated so a later `history()` reflects the move, like the server would.
    doc.status = newStatus;
    return fromOrderDocument(doc);
  }
  const res = await apiRequest<unknown>(statusUrl(orderId), {
    method: 'PATCH',
    body: JSON.stringify({ partnerId, newStatus }),
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

export interface CreateOrderRequest {
  customerPhoneNumber: string;
  customerName?: string;
  partnerId: string;
  deliveryFee: number;
  dropoffLocation: OrderPlace;
  note?: string;
}

export const ordersApi = {
  async create(input: CreateOrderRequest): Promise<OrderDocument | null> {
    if (ENV.useMockApi) {
      await delay(MOCK_LATENCY_MS);
      const now = new Date().toISOString();
      const doc: OrderDocument = {
        _id: `mock-order-${MOCK_ORDERS.length + 1}`,
        status: 'PENDING',
        customerPhoneNumber: input.customerPhoneNumber,
        deliveryFee: { $numberDecimal: String(input.deliveryFee) },
        dropoffLocation: input.dropoffLocation,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      };
      // Unshifted so a later `history()`/`list()` shows it, like the server would.
      MOCK_ORDERS.unshift(doc);
      return doc;
    }
    const res = await apiRequest<unknown>(ordersUrl(), {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return pickDocument(res) ?? null;
  },

  async list(params: ListOrdersParams = {}): Promise<Order[]> {
    if (ENV.useMockApi) {
      await delay(MOCK_LATENCY_MS);
      return MOCK_ORDERS.map(fromOrderDocument);
    }
    const res = await apiRequest<OrdersListResponse>(
      `/api/orders${buildQuery(params)}`,
      { method: 'GET' },
    );
    return (res.data ?? []).map(fromListItem);
  },

  async historyDocuments(
    range: OrderHistoryRequest,
  ): Promise<OrderDocument[]> {
    if (ENV.useMockApi) {
      // The mock is a fixed showcase set, so the range is ignored here.
      await delay(MOCK_LATENCY_MS);
      return MOCK_ORDERS;
    }
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

  /**
   * Call an order off — the same status route, asked for `CANCELED`. The button
   * is only offered while the parcel is in nobody's hands (CANCELLABLE_STATUSES)
   * and the gateway refuses anything already delivered or canceled.
   */
  async cancel({
    orderId,
    partnerId,
  }: CancelOrderRequest): Promise<Order | null> {
    return patchStatus(orderId, partnerId, 'CANCELED');
  },

  async updateStatus({
    orderId,
    partnerId,
    newStatus,
  }: UpdateOrderStatusRequest): Promise<Order | null> {
    return patchStatus(orderId, partnerId, newStatus);
  },
};
