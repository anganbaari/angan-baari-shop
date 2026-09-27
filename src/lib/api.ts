import type { Category, PaginatedResponse, Product } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://anganbaari.pythonanywhere.com/api/v1";

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
