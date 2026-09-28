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
