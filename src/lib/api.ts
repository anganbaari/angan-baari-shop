import type { Category, PaginatedResponse, Product } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://anganbaari.pythonanywhere.com/api/v1";

export interface OrderPayload {
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  cart: { product_id: number; qty: number; weight: string | null; variant_id: number | null }[];
}

export interface OrderCreatedResponse {
  status: string;
  order_number: string;
  id: number;
}

/**
 * POST /api/v1/orders/ — public guest checkout (AllowAny, no cookies or
 * CSRF token involved; `credentials` is deliberately left at the default
 * "same-origin" so the browser sends none cross-origin).
 *
 * Error shapes this has to surface, per api/views.py + DRF:
 * - 400 {status:"error", message:"No valid items in cart."} when every line
 *   referenced a product that is missing or is_available=False
 * - 400 DRF field errors, e.g. {"email":["Enter a valid email address."]}
 * - anything else (500/network) → generic message
 */
export async function createOrder(payload: OrderPayload): Promise<OrderCreatedResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON error body */
  }

  if (!response.ok) {
    throw new Error(extractApiError(data, response.status));
  }
  return data as OrderCreatedResponse;
}

/** Pulls the most human-readable message out of whichever error shape the
 * API returned, so checkout shows the API's real words rather than a
 * generic failure. */
function extractApiError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.detail === "string") return obj.detail;

    // DRF field errors: {"email": ["Enter a valid email address."]}
    const fieldMessages: string[] = [];
    for (const [field, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") {
            fieldMessages.push(field === "cart" || field === "non_field_errors" ? entry : `${field}: ${entry}`);
          }
        }
      }
    }
    if (fieldMessages.length) return fieldMessages.join(" ");
  }
  return `Could not place your order (error ${status}). Please try again.`;
}

/** Same DRF-error-shape parsing as extractApiError above, but returns every
 * message as its own entry rather than one joined string — the auth pages'
 * reference markup (login/signup/forgot-password/reset-password.html) shows
 * errors as a `{% for message in messages %}` list of separate `.msg`
 * banners, not per-field inline slots (none of these four forms have any),
 * so a list of messages maps onto that shape directly. */
function extractApiErrorMessages(data: unknown, status: number): string[] {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.message === "string") return [obj.message];
    if (typeof obj.detail === "string") return [obj.detail];

    const messages: string[] = [];
    for (const [field, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") {
            messages.push(field === "non_field_errors" ? entry : `${field}: ${entry}`);
          }
        }
      }
    }
    if (messages.length) return messages;
  }
  return [`Something went wrong (error ${status}). Please try again.`];
}

/** Thrown by the auth functions below so callers can render every message
 * as its own banner (`error.messages`) instead of just `error.message`. */
export class ApiValidationError extends Error {
  messages: string[];
  constructor(messages: string[]) {
    super(messages.join(" "));
    this.messages = messages;
  }
}

async function postAuthJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* non-JSON error body */
  }

  if (!response.ok) {
    throw new ApiValidationError(extractApiErrorMessages(data, response.status));
  }
  return data as T;
}

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUserResponse;
}

// Named *Request, not signup()/login(), because lib/auth.ts's store
// mutators are named exactly that (auth.login(token, user) persists a
// session) — a login page needs to call both this HTTP request AND that
// store mutator, so they can't share a name.
export function signupRequest(payload: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
}): Promise<AuthResponse> {
  return postAuthJson<AuthResponse>("signup/", payload);
}

export function loginRequest(payload: { email: string; password: string }): Promise<AuthResponse> {
  return postAuthJson<AuthResponse>("login/", payload);
}

export function requestPasswordReset(payload: { email: string }): Promise<{ status: string; message: string }> {
  return postAuthJson("password-reset/", payload);
}

export function confirmPasswordReset(payload: {
  token: string;
  password: string;
  confirm_password: string;
}): Promise<{ status: string; message: string }> {
  return postAuthJson("password-reset-confirm/", payload);
}

/** Attaches `Authorization: Token <token>` when one is present — for
 * authenticated /api/v1/ calls (profile, order history in a later phase).
 * Public calls (products, categories, guest checkout, the auth endpoints
 * above) don't need this at all, and nothing calls it yet.
 *
 * lib/auth.ts is imported dynamically (not at module top level) so this
 * file — imported by both server components (fetchProducts etc. in
 * page.tsx) and client components — never pulls a browser-only module
 * (localStorage, useSyncExternalStore) into server-rendered code paths;
 * it's only ever loaded at the moment a client component actually calls
 * this function. */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { getToken } = await import("./auth");
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;

  while (next) {
    const response = await fetch(next);
    if (!response.ok) {
      throw new Error(`Request to ${next} failed with status ${response.status}`);
    }
    const page: PaginatedResponse<T> = await response.json();
    results.push(...page.results);
    next = page.next;
  }

  return results;
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchAllPages<Category>(`${API_BASE_URL}/categories/`);
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  const url = new URL(`${API_BASE_URL}/products/`);
  if (categoryId) {
    url.searchParams.set("category", categoryId);
  }
  return fetchAllPages<Product>(url.toString());
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const response = await fetch(`${API_BASE_URL}/products/by-slug/${encodeURIComponent(slug)}/`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Request for product "${slug}" failed with status ${response.status}`);
  }
  return response.json();
}
