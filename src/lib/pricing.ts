import type { Product } from "./types";

/**
 * Card price line, one per pricing_mode. Deliberately does NOT use the
 * API's `starting_price` / `locked_total_price` fields for a fixed_weight
 * product that has real variant rows: those two fields mirror the Django
 * model's own starting_price()/locked_total_price(), which fall back to
 * the plain per-kg `price` rate whenever variant rows exist (that fallback
 * is only meant for a fixed_weight product with zero variants). Using them
 * here would show e.g. "Rs. 300" (the per-kg rate) on a goat that actually
 * costs Rs. 6,000 for the one specific animal in stock. Reading the
 * variant's own `total_price` instead is what's actually correct.
 */
export function formatCardPriceLine(product: Product): string {
  switch (product.pricing_mode) {
    case "fixed_quantity":
      return `Rs. ${product.price} ${product.price_unit}`.trim();

    case "variable_weight":
      return `Rs. ${product.starting_price} for ${product.starting_weight_label}`;

    case "fixed_weight":
      if (product.variants.length > 1) {
        return `${product.variants.length} sizes available`;
      }
      if (product.variants.length === 1) {
        return `Rs. ${product.variants[0].total_price}`;
      }
      // No variant rows added yet — this is the one case where the
      // fallback fields above are actually correct.
      return product.locked_total_price ? `Rs. ${product.locked_total_price}` : "Price on request";

    default:
      return `Rs. ${product.price}`;
  }
}
