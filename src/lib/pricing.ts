import type { Product, ProductVariant } from "./types";

/** Rs display rounds to whole rupees (Django's |floatformat:0), except the
 * one branch (fixed_quantity) that shows the raw price string as-is. */
function roundRs(value: string | number): string {
  return Math.round(Number(value)).toString();
}

export type PriceLines = { tbd: true } | { tbd?: false; primary: string; secondary: string };

/**
 * shop.html's card price block, ported branch-for-branch. Deliberately does
 * NOT use the API's `starting_price` / `locked_total_price` fields for a
 * fixed_weight product that has real variant rows: those mirror the Django
 * model's own methods, which fall back to the plain per-kg `price` rate
 * whenever variant rows exist (meant only for a fixed_weight product with
 * zero variants). That would show e.g. "Rs. 300" (the per-kg rate) on a
 * goat that actually costs Rs. 22,400 for the one animal in stock — reading
 * the variants' own total_price is what's actually correct.
 */
export function getCardPriceLines(product: Product): PriceLines {
  if (!product.price || Number(product.price) <= 0) {
    return { tbd: true };
  }

  if (product.pricing_mode === "variable_weight") {
    return {
      primary: `From Rs. ${roundRs(product.starting_price ?? product.price)}`,
      secondary: `per ${product.starting_weight_label ?? product.weight_unit_label}`,
    };
  }

  if (product.pricing_mode === "fixed_weight") {
    const variants = product.variants;
    if (variants.length > 1) {
      const totals = variants.map((v) => Number(v.total_price));
      return {
        primary: `Rs. ${roundRs(Math.min(...totals))}–${roundRs(Math.max(...totals))}`,
        secondary: `${variants.length} sizes available`,
      };
    }
    if (variants.length === 1) {
      return { primary: `Rs. ${roundRs(variants[0].total_price)}`, secondary: "Fixed price" };
    }
    // No variant rows yet — the only case where the fallback field is correct.
    return {
      primary: `Rs. ${roundRs(product.locked_total_price ?? product.price)}`,
      secondary: `${Number(product.fixed_weight ?? 0).toFixed(2)} kg, fixed price`,
    };
  }

  // fixed_quantity (and any unrecognized mode, matching the template's else)
  return { primary: `Rs. ${product.price}`, secondary: product.price_unit };
}

/** Product detail page's price block (a superset of the card's — includes
 * the per-unit rate alongside the "from" price for variable_weight, and can
 * reflect whichever size pill is currently selected for fixed_weight). */
export function getDetailPriceLines(
  product: Product,
  selectedVariant?: ProductVariant,
): PriceLines {
  if (product.pricing_mode === "variable_weight") {
    return {
      primary: `From Rs. ${roundRs(product.starting_price ?? product.price)}`,
      secondary: `per ${product.starting_weight_label ?? product.weight_unit_label} (Rs. ${roundRs(
        product.price,
      )}/${product.weight_unit_label})`,
    };
  }

  if (product.pricing_mode === "fixed_weight") {
    const variant = selectedVariant ?? product.variants[0];
    if (variant) {
      return {
        primary: `Rs. ${roundRs(variant.total_price)}`,
        secondary: `${Number(variant.weight).toFixed(2)} kg, fixed price`,
      };
    }
    return {
      primary: `Rs. ${roundRs(product.locked_total_price ?? product.price)}`,
      secondary: `${Number(product.fixed_weight ?? 0).toFixed(2)} kg, fixed price`,
    };
  }

  return { primary: `Rs. ${roundRs(product.price)}`, secondary: product.price_unit };
}
