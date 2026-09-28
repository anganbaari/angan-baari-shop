// Mirrors api/serializers.py in the Django project exactly. DRF serializes
// DecimalField (and SerializerMethodFields wrapping one) as strings, not
// numbers — keep these as `string` and parse with Number()/parseFloat()
// only where you actually need to do arithmetic or formatting.

export interface Category {
  id: number;
  name: string;
  parent: number | null;
  icon: string;
  order: number;
}

export interface ProductVariant {
  id: number;
  weight: string;
  price_override: string | null;
  label: string;
  is_available: boolean;
  total_price: string;
}

export type PricingMode = "variable_weight" | "fixed_quantity" | "fixed_weight";

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: Category | null;
  description: string;
  detail_description: string;
  season: string;
  farming_method: string;
  is_available: boolean;
  main_image: string | null;
  /** Every photo, in gallery order, with main_image already included as
   * images[0] — render this wholesale, not alongside main_image, or the
   * first photo duplicates. See ProductSerializer.get_images(). */
  images: string[];
  price: string;
  price_unit: string;
  origin: "farm" | "sourced";
  barcode: string | null;
  pricing_mode: PricingMode;
  weight_step: string;
  fixed_weight: string | null;
  weight_unit_label: string;
  variants: ProductVariant[];
  starting_price: string | null;
  starting_weight_label: string | null;
  locked_total_price: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
