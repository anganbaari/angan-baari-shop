"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { lineSubtotal, useCart } from "@/lib/cart";
import { createOrder } from "@/lib/api";

const money = (n: number) => `Rs. ${Math.round(n)}`;
export const CONFIRMATION_KEY = "anganbaari.lastOrder.v1";

/**
 * Ported from reference/checkout.html. Real: delivery form, order summary
 * from the live cart, cash-on-delivery badge, place-order → POST
 * /api/v1/orders/, API error surfacing, recommendations.
 * Skipped (no backend support): coupon box (no Coupon endpoint in the API),
 * prefilled name/email from a logged-in user, and saved addresses — see the
 * summary in the PR/commit notes.
 */
export default function CheckoutView({ recommendPool }: { recommendPool: Product[] }) {
  const router = useRouter();
  const { items, hydrated, total, addItem, clearCart } = useCart();

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [variantChoice, setVariantChoice] = useState<Record<number, number>>({});

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }

  const inCartIds = useMemo(() => new Set(items.map((l) => l.productId)), [items]);
  const recommended = useMemo(
    () => recommendPool.filter((p) => !inCartIds.has(p.id)).slice(0, 8),
    [recommendPool, inCartIds],
  );

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        message: form.message.trim(),
        cart: items.map((line) => ({
          product_id: line.productId,
          qty: line.qty,
          weight: line.weight,
          variant_id: line.variantId,
        })),
      });

      // Stash what the confirmation page needs before the cart is cleared.
      try {
        window.sessionStorage.setItem(
          CONFIRMATION_KEY,
          JSON.stringify({
            orderNumber: result.order_number,
            name: form.name.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            items: items.map((line) => ({ name: line.name, qty: line.qty, weight: line.weight })),
            total,
          }),
        );
      } catch {
        /* confirmation page falls back to just the order number */
      }

      clearCart();
      router.push("/order-confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      setSubmitting(false);
    }
  }

  if (!hydrated) return <div className="checkout-page" />;

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="cart-empty">
          <div className="empty-badge">
            <i className="fas fa-basket-shopping" />
          </div>
          <h2>Your cart is empty</h2>
          <p>Add something fresh from the farm before checking out.</p>
          <Link href="/" className="btn-browse">
            <i className="fas fa-leaf" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="checkout-page">
        <div className="checkout-header-row">
          <h1 className="checkout-title">Checkout</h1>
          <div className="checkout-steps">
            Cart <span className="sep">→</span> <b>Checkout</b> <span className="sep">→</span> Confirmation
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-form">
            <div className="form-title">
              <i className="fas fa-truck" /> Delivery Information
            </div>
            <form id="checkoutForm" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="co-name">Full Name *</label>
                  <input
                    id="co-name"
                    type="text"
                    name="name"
                    placeholder="Ramesh Thapa"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-phone">Phone Number *</label>
                  <input
                    id="co-phone"
                    type="tel"
                    name="phone"
                    placeholder="98XXXXXXXX"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="co-email">Email *</label>
                <input
                  id="co-email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="co-address">Delivery Address *</label>
                <textarea
                  id="co-address"
                  name="address"
                  rows={3}
                  placeholder="Ward No, Tole, City, District..."
                  required
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="co-message">Additional Notes</label>
                <textarea
                  id="co-message"
                  name="message"
                  rows={2}
                  placeholder="Any special instructions..."
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                />
              </div>

              <div className="payment-badge">
                <i className="fas fa-money-bill-wave" />
                Cash on Delivery — Pay when you receive your order
              </div>
            </form>
          </div>

          <div className="order-summary">
            <div className="summary-title">
              Your Order
              <span className="item-count">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>

            <div>
              {items.map((line) => (
                <div className="summary-item" key={line.lineKey}>
                  <div className="summary-item-info">
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.name}
                        width={40}
                        height={40}
                        className="summary-item-thumb"
                      />
                    )}
                    <div>
                      <div className="summary-item-name">{line.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Rs. {line.price} × {line.qty}
                        {line.weight ? ` · ${line.weight} ${line.weightUnitLabel || "kg"}` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--forest)", whiteSpace: "nowrap" }}>
                    {money(lineSubtotal(line))}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-item" style={{ borderBottom: "none" }}>
              <span>Subtotal</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>

            {error && (
              <div className="coupon-msg error" style={{ marginTop: 14 }}>
                <i className="fas fa-exclamation-circle" /> {error}
              </div>
            )}

            <button type="submit" form="checkoutForm" className="btn-place-order" disabled={submitting}>
              <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-check-circle"} />{" "}
              {submitting ? "Placing Order…" : <>Place Order — Rs. {Math.round(total)}</>}
            </button>

            <div className="trust-row">
              <i className="fas fa-shield-alt" /> Secure order · Cash on delivery
            </div>
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="recommend-section">
            <h2>You might also like</h2>
            <div className="rec-sub">Fresh picks to go with your order</div>
            <div className="recommend-scroll">
              {recommended.map((product) => {
                const variants = product.variants.filter((v) => v.is_available);
                const showVariantSelect = product.pricing_mode === "fixed_weight" && variants.length > 1;
                return (
                  <div className="rec-card" key={product.id}>
                    <Link href={`/product/${product.slug}`} className="rec-card-link">
                      {product.main_image && (
                        <Image src={product.main_image} alt={product.name} width={170} height={130} style={{ width: "100%", height: 130, objectFit: "cover" }} />
                      )}
                      <div className="rec-card-body">
                        <div className="rec-name">{product.name}</div>
                      </div>
                    </Link>
                    <div className="rec-card-footer">
                      {showVariantSelect ? (
                        <select
                          className="rec-variant-select"
                          value={variantChoice[product.id] ?? variants[0].id}
                          onChange={(e) =>
                            setVariantChoice((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))
                          }
                        >
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {Number(v.weight).toFixed(2)} kg — Rs. {Math.round(Number(v.total_price))}
                              {v.label ? ` (${v.label})` : ""}
                            </option>
                          ))}
                        </select>
                      ) : null}
                      <div className="rec-card-bottom">
                        <span className="rec-price">
                          {showVariantSelect ? `${variants.length} sizes` : `Rs. ${product.price}`}
                        </span>
                        <button
                          type="button"
                          className="rec-add-btn"
                          aria-label={`Add ${product.name} to cart`}
                          onClick={() => {
                            const chosen = showVariantSelect
                              ? variants.find((v) => v.id === (variantChoice[product.id] ?? variants[0].id))
                              : undefined;
                            addItem(product, { variant: chosen ?? null });
                            showToast(`${product.name} added to cart`);
                          }}
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div id="checkoutToast" className={toast ? "show" : undefined}>
        <i className="fas fa-check-circle" /> <span>{toast}</span>
      </div>
    </>
  );
}
