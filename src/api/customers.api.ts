import { ENV } from '../config/env';
import { apiRequest } from './client';
import { ApiError } from './errors';

/**
 * Customer lookup by phone number.
 *
 * `POST /api/findCustomer` answers "have we delivered to this number before?".
 * The gateway returns the customer's name plus three **index-aligned** arrays —
 * `drop_off_address[i]`, `googlemap[i]` and `zone[i]` all describe the same
 * saved dropoff. This module zips them into one list so callers never have to
 * juggle three cursors, and normalises "we don't know this number" into `null`.
 */

/** Raw gateway shape — three parallel arrays, one entry each per saved dropoff. */
export interface FindCustomerResponse {
  name: string;
  drop_off_address: string[];
  googlemap: string[];
  zone: string[];
}

/** One saved dropoff, after zipping the response's parallel arrays. */
export interface CustomerAddress {
  description: string;
  googleMapsLink: string;
  zone: string;
}

/** A known customer. Absent from the gateway (unknown number) ⇒ `null`. */
export interface CustomerLookup {
  name: string;
  addresses: CustomerAddress[];
}

// --- Mock -------------------------------------------------------------------

/**
 * Mock switch for **this endpoint only**, so the lookup can be exercised while
 * the gateway route is still being built — without flipping `USE_MOCK_API` in
 * `.env`, which would mock login, orders and everything else too.
 *
 * Flip to `false` (or delete the branch) once `/api/findCustomer` is live.
 */
const USE_MOCK_FIND_CUSTOMER = true;

const shouldMock = (): boolean => USE_MOCK_FIND_CUSTOMER || ENV.useMockApi;

/** Roughly what a round trip to the gateway costs, so the spinner is visible. */
const MOCK_LATENCY_MS = 700;

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Numbers with a scripted answer. Anything else falls back to the parity rule
 * below, so both branches (known / unknown) are reachable from any keypad:
 *
 *  - `+961 70 123 456` → three saved addresses
 *  - `+961 71 000 000` → exactly one saved address
 *  - last digit **even** → a generated customer with two addresses
 *  - last digit **odd**  → not found (the manual-entry path)
 */
const MOCK_CUSTOMERS: Record<string, FindCustomerResponse> = {
  '+96170123456': {
    name: 'Rami Haddad',
    drop_off_address: [
      'Hamra Street, Beirut',
      'ABC Mall, Achrafieh',
      'Kaslik Highway, Jounieh',
    ],
    googlemap: [
      'https://maps.google.com/?q=33.8959,35.4823',
      'https://maps.google.com/?q=33.8886,35.5203',
      'https://maps.google.com/?q=33.9789,35.6156',
    ],
    zone: ['Beirut — Hamra', 'Beirut — Achrafieh', 'Keserwan — Jounieh'],
  },
  '+96171000000': {
    name: 'Layla Nasr',
    drop_off_address: ['Mar Mikhael, Beirut'],
    googlemap: ['https://maps.google.com/?q=33.8977,35.5231'],
    zone: ['Beirut — Mar Mikhael'],
  },
};

const mockFind = (phoneNumber: string): FindCustomerResponse | null => {
  const scripted = MOCK_CUSTOMERS[phoneNumber.replace(/\s/g, '')];
  if (scripted) {
    return scripted;
  }
  const lastDigit = Number(phoneNumber.replace(/\D/g, '').slice(-1));
  if (!Number.isFinite(lastDigit) || lastDigit % 2 !== 0) {
    return null;
  }
  return {
    name: 'Nadia Khoury',
    drop_off_address: ['Verdun Street, Beirut', 'Dbayeh Seaside, Metn'],
    googlemap: [
      'https://maps.google.com/?q=33.8785,35.4808',
      'https://maps.google.com/?q=33.9469,35.5928',
    ],
    zone: ['Beirut — Verdun', 'Metn — Dbayeh'],
  };
};

// --- Normalisation ----------------------------------------------------------

/**
 * The controller may hand the customer back bare or wrapped (`{ data }` /
 * `{ customer }`), and the arrays may be missing entirely. Treat the whole
 * response as untrusted and dig out what actually looks like a customer.
 */
const pickPayload = (res: unknown): Partial<FindCustomerResponse> | null => {
  if (!res || typeof res !== 'object') {
    return null;
  }
  const record = res as Record<string, unknown>;
  const inner = record.data ?? record.customer ?? record;
  if (!inner || typeof inner !== 'object') {
    return null;
  }
  return inner as Partial<FindCustomerResponse>;
};

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(item => (typeof item === 'string' ? item.trim() : ''))
    : [];

/**
 * Zip the parallel arrays. The address list is what counts a dropoff — a link
 * or a zone with no address behind it has nothing to label it in the dropdown,
 * so the shorter arrays just contribute empty strings.
 */
const toLookup = (payload: Partial<FindCustomerResponse> | null) => {
  if (!payload) {
    return null;
  }
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const descriptions = toStringArray(payload.drop_off_address).filter(Boolean);
  const links = toStringArray(payload.googlemap);
  const zones = toStringArray(payload.zone);

  const addresses: CustomerAddress[] = descriptions.map((description, i) => ({
    description,
    googleMapsLink: links[i] ?? '',
    zone: zones[i] ?? '',
  }));

  // Nothing worth autofilling ⇒ same as an unknown number: enter it by hand.
  if (!name && addresses.length === 0) {
    return null;
  }
  return { name, addresses } satisfies CustomerLookup;
};

// --- Public API -------------------------------------------------------------

export const customersApi = {
  /**
   * Look a customer up by their E.164 phone number.
   *
   * Resolves to `null` — never throws — when the number is unknown (404 or an
   * empty payload); the caller then collects the details manually. Real
   * failures (offline, 500, timeout) still throw so they can be surfaced.
   */
  async find(phoneNumber: string): Promise<CustomerLookup | null> {
    if (shouldMock()) {
      await delay(MOCK_LATENCY_MS);
      return toLookup(mockFind(phoneNumber));
    }

    try {
      const res = await apiRequest<unknown>('/api/findCustomer', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber }),
      });
      return toLookup(pickPayload(res));
    } catch (error) {
      // An unknown customer is an expected answer, not an error.
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  },
};
