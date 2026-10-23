"use client";

import { useEffect, useState } from "react";
import { fetchCartQuote } from "./api";
import { useAuth } from "./auth";
import type { CartLine } from "./cart";
import type { CartQuote, QuoteLineOk } from "./types";

const DEBOUNCE_MS = 300;

/** Prices the cart through POST /cart/quote/ — the server is the only
 * authority on price and on whether offers apply. Debounced; re-runs when
 * the cart or the login state changes.
 *
 * `quote` is null until a quote for the *current* cart has arrived (and
 * after any failure), so callers fall back to the local pricing.ts/cart.ts
 * numbers in both cases and never block on this. Quote lines come back in
 * request order, so they are matched to cart lines by index. */
export function useCartQuote(items: CartLine[]) {
  const { token } = useAuth();
  const key = JSON.stringify([
    token,
    items.map((l) => [l.productId, l.weight, l.qty, l.variantId]),
  ]);
  const [result, setResult] = useState<{ key: string; quote: CartQuote | null } | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchCartQuote(
        items.map((l) => ({
          product_id: l.productId,
          weight: l.weight,
          quantity: l.qty,
          variant_id: l.variantId,
        })),
        controller.signal,
      )
        .then((quote) => setResult({ key, quote }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ key, quote: null });
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `key` already encodes every input the request is built from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const quote =
    result && result.key === key && result.quote && result.quote.lines.length === items.length
      ? result.quote
      : null;

  /** The priced line for cart line `index`, or null if it errored / no quote. */
  function lineAt(index: number): QuoteLineOk | null {
    const line = quote?.lines[index];
    return line && !("error" in line) ? line : null;
  }

  /** The server's error for cart line `index`, if it rejected that line. */
  function errorAt(index: number): string | null {
    const line = quote?.lines[index];
    return line && "error" in line ? line.error : null;
  }

  return { quote, lineAt, errorAt };
}

export function hasDiscount(line: QuoteLineOk): boolean {
  return Number(line.discount) > 0;
}
