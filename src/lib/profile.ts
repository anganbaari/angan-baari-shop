import type { PaginatedResponse, Product, ProductVariant } from "./types";
import { authFetch, ApiValidationError, extractApiErrorMessages } from "./api";

// Wraps every /api/v1/ call the Profile page needs (orders, wishlist,
// coupons, account settings) — see api/views.py's "PROFILE PAGE
// (token-authenticated)" section for the exact backend shapes these mirror.
// All of it goes through authFetch, so every call already carries
// `Authorization: Token <key>` when one exists; a 401 here means the token
// itself is missing/invalid (expired, revoked server-side, or the visitor
// was never logged in) — thrown as ApiSessionError so callers can tell that
// case apart from an ordinary validation/business-rule failure and send the
// visitor back to /login instead of just showing an error message.
export class ApiSessionError extends Error {
  constructor() {
    super("Your session has expired — please log in again.");
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Shared response handling for the simple {status:"ok"|"error", message?}
 * endpoints (cancel/reorder/wishlist) — as opposed to updateProfile/
 * changePassword, which use DRF's per-field error shape via ApiValidationError. */
async function handleSimpleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new ApiSessionError();
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && typeof (data as Record<string, unknown>).message === "string"
        ? (data as Record<string, string>).message
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return data as T;
}

async function fetchAllAuthedPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = path;
  while (next) {
    const response: Response = await authFetch(next);
    if (response.status === 401) throw new ApiSessionError();
    if (!response.ok) throw new Error(`Request to ${next} failed with status ${response.status}`);
    const page: PaginatedResponse<T> = await response.json();
    results.push(...page.results);
    // `next` from the API is an absolute URL already including API_BASE_URL —
    // authFetch always prefixes its `path` argument with API_BASE_URL, so a
    // second call would double it up. Strip that prefix back off.
    next = page.next ? page.next.replace(/^https?:\/\/[^/]+\/api\/v1/, "") : null;
  }
  return results;
}

// ─── Orders ───────────────────────────────────────────────────

export interface OrderHistoryItem {
  id: number;
  order_number: string;
  ordered_at: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  status_display: string;
  product_interest: string;
  address: string;
  can_cancel: boolean;
  has_cart_snapshot: boolean;
}

export function fetchMyOrders(): Promise<OrderHistoryItem[]> {
  return fetchAllAuthedPages<OrderHistoryItem>("/profile/orders/");
}

export async function cancelOrder(orderId: number): Promise<OrderHistoryItem> {
  const response = await authFetch(`/orders/${orderId}/cancel/`, { method: "POST" });
  const data = await handleSimpleResponse<{ status: string; order: OrderHistoryItem }>(response);
  return data.order;
}

export interface ReorderItem {
  product: Product;
  weight: string | null;
  qty: number;
}

export interface ReorderResult {
  items: ReorderItem[];
  skipped_count: number;
  message?: string;
}

export async function reorderOrder(orderId: number): Promise<ReorderResult> {
  const response = await authFetch(`/orders/${orderId}/reorder/`, { method: "POST" });
  return handleSimpleResponse<ReorderResult>(response);
}

// ─── Wishlist ─────────────────────────────────────────────────

export interface WishlistItem {
  id: number;
  product: Product;
  variant: ProductVariant | null;
  added_at: string;
}

export function fetchWishlist(): Promise<WishlistItem[]> {
  return fetchAllAuthedPages<WishlistItem>("/wishlist/");
}

/** Thrown by wishlistToggle specifically for the "not logged in" case, kept
 * separate from ApiSessionError since callers here (ProductCard/
 * ProductDetailView) aren't on a route-protected page — they need to know
 * to redirect rather than assume a token that never existed just expired. */
export async function wishlistToggle(
  productId: number,
  variantId?: number | null,
): Promise<{ is_saved: boolean }> {
  const response = await authFetch("/wishlist/toggle/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId ?? undefined }),
  });
  if (response.status === 401) throw new ApiSessionError();
  return handleSimpleResponse<{ is_saved: boolean }>(response);
}

export async function wishlistSetVariant(
  productId: number,
  variantId: number,
): Promise<{ weight: string; price: string }> {
  const response = await authFetch("/wishlist/set-variant/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId }),
  });
  return handleSimpleResponse<{ weight: string; price: string }>(response);
}

export async function wishlistMoveToCart(
  productId: number,
  variantId?: number | null,
): Promise<{ product: Product; variant: ProductVariant | null }> {
  const response = await authFetch("/wishlist/move-to-cart/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, variant_id: variantId ?? undefined }),
  });
  return handleSimpleResponse<{ product: Product; variant: ProductVariant | null }>(response);
}

// ─── Coupons ──────────────────────────────────────────────────

export interface Coupon {
  id: number;
  code: string;
  festival_name: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  max_discount_amount: string | null;
  min_order_amount: string;
}

export function fetchLiveCoupons(): Promise<Coupon[]> {
  return fetchAllAuthedPages<Coupon>("/coupons/");
}

// ─── Account settings ───────────────────────────────────────────

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
}

export async function updateProfile(payload: { name: string; email: string }): Promise<ProfileUser> {
  const response = await authFetch("/profile/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 401) throw new ApiSessionError();
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiValidationError(extractApiErrorMessages(data, response.status));
  }
  return (data as { status: string; user: ProfileUser }).user;
}

export async function changePassword(payload: {
  old_password: string;
  new_password1: string;
  new_password2: string;
}): Promise<void> {
  const response = await authFetch("/profile/change-password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 401) throw new ApiSessionError();
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new ApiValidationError(extractApiErrorMessages(data, response.status));
  }
}
