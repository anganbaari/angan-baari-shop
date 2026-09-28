"use client";

import { useSyncExternalStore } from "react";
import type { PricingMode, Product, ProductVariant } from "./types";

/**
 * Cart line shape deliberately mirrors the Django session cart built by
 * add_to_cart() in shop/views.py (same fields, same line_key scheme, same
 * meaning of `price`), so the checkout payload maps straight onto what
 * POST /api/v1/orders/ already expects and the two systems can't drift.
 *
 * `price` is the UNIT price for variable_weight/fixed_quantity, but the
 * LOCKED TOTAL for fixed_weight (one specific animal) — exactly as the
 * Django cart stores it.
 */
export interface CartLine {
  lineKey: string;
  productId: number;
  slug: string;
  name: string;
  price: string;
  priceUnit: string;
  image: string | null;
  qty: number;
  weight: string | null;
  pricingMode: PricingMode;
  weightStep: string | null;
  weightUnitLabel: string | null;
  variantId: number | null;
}

const CART_KEY = "anganbaari.cart.v1";
const SAVED_KEY = "anganbaari.saved.v1";

/** Mirrors format_weight() in shop/views.py: snap to the nearest multiple of
 * the product's own step, never below one step, 2dp string. */
export function formatWeight(raw: number | string, step: number | string): string {
  const stepNum = Number(step) > 0 ? Number(step) : 0.5;
  let weight = Number(raw);
  if (!Number.isFinite(weight) || weight <= 0) weight = stepNum;
  let snapped = Math.round(weight / stepNum) * stepNum;
  if (snapped <= 0) snapped = stepNum;
  return snapped.toFixed(2);
}

/** Mirrors make_line_key()/resolve_cart_line() in shop/views.py. */
function makeLineKey(product: Product, weight: string | null, variantId: number | null): string {
  if (product.pricing_mode === "fixed_weight" && variantId) return `${product.id}_v${variantId}`;
  if (weight) return `${product.id}_${weight}`;
  return String(product.id);
}

/** Mirrors line_subtotal() in shop/views.py — the authoritative one. Note
 * cart.html's own inline JS uses `price * qty * weight` unconditionally,
 * which would be wrong for fixed_weight (whose `price` is already the
 * locked total for that animal, and whose `weight` is the animal's own
 * weight); that path isn't reachable there because fixed_weight rows have
 * no qty/weight controls to re-render from. This uses the correct rule. */
export function lineSubtotal(line: CartLine): number {
  const price = Number(line.price) || 0;
  const qty = Number(line.qty) || 0;
  if (line.pricingMode === "fixed_weight") return price * qty;
  const weight = line.weight ? Number(line.weight) : 1;
  return price * qty * weight;
}

export interface AddOptions {
  weight?: string | null;
  qty?: number;
  variant?: ProductVariant | null;
}

/** Builds a cart line from live API product data, applying the same
 * per-pricing_mode rules resolve_cart_line() uses server-side. */
function buildLine(product: Product, options: AddOptions = {}): CartLine {
  const mode = product.pricing_mode;

  if (mode === "variable_weight") {
    const step = product.weight_step || "0.50";
    const weight = formatWeight(options.weight ?? step, step);
    return {
      lineKey: makeLineKey(product, weight, null),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      priceUnit: product.price_unit,
      image: product.main_image,
      qty: 1,
      weight,
      pricingMode: mode,
      weightStep: String(product.weight_step),
      weightUnitLabel: product.weight_unit_label,
      variantId: null,
    };
  }

  if (mode === "fixed_weight") {
    // Cheapest available animal by default, same fallback as the server.
    const available = product.variants.filter((v) => v.is_available);
    const variant =
      options.variant ??
      [...available].sort((a, b) => Number(a.total_price) - Number(b.total_price))[0];

    if (variant) {
      const weight = Number(variant.weight).toFixed(2);
      return {
        lineKey: makeLineKey(product, weight, variant.id),
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: String(variant.total_price),
        priceUnit: "(fixed price)",
        image: product.main_image,
        qty: 1,
        weight,
        pricingMode: mode,
        weightStep: null,
        weightUnitLabel: null,
        variantId: variant.id,
      };
    }

    // fixed_weight product with no variant rows — product.fixed_weight fallback.
    const weight = product.fixed_weight ? Number(product.fixed_weight).toFixed(2) : null;
    return {
      lineKey: makeLineKey(product, weight, null),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.locked_total_price ?? product.price,
      priceUnit: "(fixed price)",
      image: product.main_image,
      qty: 1,
      weight,
      pricingMode: mode,
      weightStep: null,
      weightUnitLabel: null,
      variantId: null,
    };
  }

  // fixed_quantity
  return {
    lineKey: makeLineKey(product, null, null),
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    priceUnit: product.price_unit,
    image: product.main_image,
    qty: Math.max(1, options.qty ?? 1),
    weight: null,
    pricingMode: mode,
    weightStep: null,
    weightUnitLabel: null,
    variantId: null,
  };
}

// ─── External store ────────────────────────────────────────────
// A module-level store read through useSyncExternalStore, rather than
// useState + a mount effect: localStorage isn't available during SSR, and
// this is the API React provides for reading external/browser state without
// a hydration mismatch (getServerSnapshot renders the empty cart, then the
// real one takes over once hydrated). It also means no provider in the
// layout, and the cart stays in sync across tabs via the `storage` event.

interface CartState {
  items: CartLine[];
  saved: CartLine[];
  hydrated: boolean;
}

const EMPTY_STATE: CartState = { items: [], saved: [], hydrated: false };

let state: CartState = EMPTY_STATE;
const listeners = new Set<() => void>();

function readStored(key: string): CartLine[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(state.items));
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(state.saved));
  } catch {
    /* private mode / quota — the cart still works for this page session */
  }
}

function emit() {
  for (const listener of listeners) listener();
}

/** Replaces state and persists. A fresh object each time keeps
 * getSnapshot()'s identity check meaningful. */
function commit(next: { items?: CartLine[]; saved?: CartLine[] }) {
  state = { ...state, ...next, hydrated: true };
  persist();
  emit();
}

function hydrateFromStorage() {
  if (state.hydrated) return;
  state = { items: readStored(CART_KEY), saved: readStored(SAVED_KEY), hydrated: true };
  emit();
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== CART_KEY && event.key !== SAVED_KEY) return;
  state = { items: readStored(CART_KEY), saved: readStored(SAVED_KEY), hydrated: true };
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    window.addEventListener("storage", handleStorageEvent);
  }
  listeners.add(listener);
  hydrateFromStorage();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_STATE;

// ─── Mutators (module-level, so identities are stable) ─────────

export function addItem(product: Product, options: AddOptions = {}) {
  const line = buildLine(product, options);
  const existing = state.items.find((l) => l.lineKey === line.lineKey);

  if (!existing) {
    commit({ items: [...state.items, line] });
    return;
  }
  // A fixed_weight line is one unique animal — adding it again must not
  // stack quantity (same rule as add_to_cart() server-side).
  if (line.pricingMode === "fixed_weight") return;

  commit({
    items: state.items.map((l) =>
      l.lineKey === line.lineKey ? { ...l, qty: l.qty + line.qty } : l,
    ),
  });
}

export function removeItem(lineKey: string) {
  commit({ items: state.items.filter((l) => l.lineKey !== lineKey) });
}

export function updateQty(lineKey: string, delta: number) {
  commit({
    items: state.items.flatMap((l) => {
      if (l.lineKey !== lineKey) return [l];
      if (l.pricingMode === "fixed_weight") return [l];
      const qty = l.qty + delta;
      return qty <= 0 ? [] : [{ ...l, qty }];
    }),
  });
}

export function updateWeight(lineKey: string, nextWeight: string) {
  const target = state.items.find((l) => l.lineKey === lineKey);
  if (!target || target.pricingMode === "fixed_weight") return;

  const newKey = `${target.productId}_${nextWeight}`;
  const merging = state.items.find((l) => l.lineKey === newKey && l.lineKey !== lineKey);

  // Weight is part of a line's identity, so changing it re-keys the line and
  // merges into an existing line at that weight — same as
  // update_cart_weight() server-side.
  if (merging) {
    commit({
      items: state.items
        .filter((l) => l.lineKey !== lineKey)
        .map((l) => (l.lineKey === newKey ? { ...l, qty: l.qty + target.qty } : l)),
    });
    return;
  }
  commit({
    items: state.items.map((l) =>
      l.lineKey === lineKey ? { ...l, lineKey: newKey, weight: nextWeight } : l,
    ),
  });
}

export function saveForLater(lineKey: string) {
  const line = state.items.find((l) => l.lineKey === lineKey);
  if (!line) return;
  commit({
    items: state.items.filter((l) => l.lineKey !== lineKey),
    saved: state.saved.some((s) => s.lineKey === lineKey) ? state.saved : [...state.saved, line],
  });
}

export function moveToCart(lineKey: string) {
  const line = state.saved.find((s) => s.lineKey === lineKey);
  if (!line) return;

  const existing = state.items.find((l) => l.lineKey === lineKey);
  const items = !existing
    ? [...state.items, { ...line, qty: line.qty || 1 }]
    : line.pricingMode === "fixed_weight"
      ? state.items
      : state.items.map((l) => (l.lineKey === lineKey ? { ...l, qty: l.qty + 1 } : l));

  commit({ items, saved: state.saved.filter((s) => s.lineKey !== lineKey) });
}

export function removeSaved(lineKey: string) {
  commit({ saved: state.saved.filter((s) => s.lineKey !== lineKey) });
}

export function clearCart() {
  commit({ items: [] });
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
}

export function cartTotal(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + lineSubtotal(l), 0);
}

/** Live cart state + the mutators. No provider needed — the store is a
 * module singleton, so every component (including the nav badge) sees the
 * same cart. */
export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items: snapshot.items,
    saved: snapshot.saved,
    hydrated: snapshot.hydrated,
    count: cartCount(snapshot.items),
    total: cartTotal(snapshot.items),
    addItem,
    removeItem,
    updateQty,
    updateWeight,
    saveForLater,
    moveToCart,
    removeSaved,
    clearCart,
  };
}
