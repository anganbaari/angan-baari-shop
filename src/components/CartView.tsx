"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { formatWeight, lineSubtotal, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { fetchWishlist, wishlistMoveToCart, wishlistToggle, type WishlistItem } from "@/lib/profile";

const money = (n: number) => `Rs. ${Math.round(n)}`;

/**
 * Ported from reference/cart.html. Real: line items, weight/qty steppers,
 * remove, save-for-later, subtotals, order summary, empty state,
 * recommendations, and (Phase 4) the logged-in "My Wishlist" section. Skipped
 * (no backend): offer chips / struck-through original prices (no Offers
 * endpoint in the API).
 */
export default function CartView({ recommendPool }: { recommendPool: Product[] }) {
  const {
    items,
    saved,
    hydrated,
    total,
    removeItem,
    updateQty,
    updateWeight,
    saveForLater,
    moveToCart,
    removeSaved,
    addItem,
  } = useCart();

  const { isLoggedIn } = useAuth();

  const [toast, setToast] = useState<string | null>(null);
  const [variantChoice, setVariantChoice] = useState<Record<number, number>>({});

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }

  // "My Wishlist" (reference/cart.html) — the account-backed wishlist, kept
  // entirely separate from the localStorage "Saved for Later" list above.
  // Reference wraps the whole section in {% if user.is_authenticated %} with
  // nothing shown in its place for guests (no "log in to see your wishlist"
  // prompt) — matched here by fetching only when logged in and rendering
  // nothing at all otherwise.
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistBusyIds, setWishlistBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Nothing to reset on logout: the render guard below already checks
    // isLoggedIn directly, so stale items just stop being shown.
    if (!isLoggedIn) return;
    fetchWishlist()
      .then(setWishlistItems)
      .catch(() => setWishlistItems([]));
  }, [isLoggedIn]);

  function setWishlistBusy(productId: number, busy: boolean) {
    setWishlistBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  async function handleWishlistRemove(item: WishlistItem) {
    setWishlistBusy(item.product.id, true);
    try {
      await wishlistToggle(item.product.id);
      setWishlistItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      showToast("Could not remove this item right now — please try again.");
    } finally {
      setWishlistBusy(item.product.id, false);
    }
  }

  async function handleWishlistMoveToCart(item: WishlistItem) {
    setWishlistBusy(item.product.id, true);
    try {
      const result = await wishlistMoveToCart(item.product.id, item.variant?.id);
      addItem(result.product, { variant: result.variant });
      setWishlistItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(`${result.product.name} added to cart`);
    } catch {
      showToast("Could not add this item to your cart right now — please try again.");
    } finally {
      setWishlistBusy(item.product.id, false);
    }
  }

  const inCartIds = useMemo(() => new Set(items.map((l) => l.productId)), [items]);
  const recommended = useMemo(
    () => recommendPool.filter((p) => !inCartIds.has(p.id)).slice(0, 8),
    [recommendPool, inCartIds],
  );

  // Until localStorage has been read, render nothing rather than flashing the
  // empty-cart state at someone who actually has items.
  if (!hydrated) return <div className="cart-page" />;

  const itemCount = items.length;

  return (
    <>
      <div className="cart-page">
        {itemCount > 0 && (
          <>
            <div className="cart-header">
              <h1 className="cart-title">
                Your Cart{" "}
                <span className="count-pill">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                </span>
              </h1>
              <span className="cart-header-sub">Review your order before checkout</span>
            </div>

            <div className="cart-layout">
              <div className="cart-items">
                {items.map((line) => {
                  const step = Number(line.weightStep) || 0.5;
                  return (
                    <div className="cart-item" key={line.lineKey}>
                      <div className="cart-item-img">
                        {line.image ? (
                          <Image src={line.image} alt={line.name} width={92} height={92} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div className="img-fallback">
                            <i className="fas fa-seedling" />
                          </div>
                        )}
                      </div>

                      <div className="cart-item-info">
                        <div className="cart-item-name">{line.name}</div>
                        <div className="cart-item-price-row">
                          <span className="cart-item-price">
                            Rs. {line.price}
                            <span className="unit"> {line.priceUnit}</span>
                          </span>
                        </div>

                        {line.pricingMode === "fixed_weight" ? (
                          <div className="weight-row">
                            <span className="weight-label">Weight</span>
                            <span className="weight-locked">
                              <i className="fas fa-lock" /> {line.weight} kg (fixed)
                            </span>
                          </div>
                        ) : line.weight ? (
                          <div className="weight-row">
                            <span className="weight-label">Weight</span>
                            <div className="weight-stepper">
                              <button
                                type="button"
                                className="weight-step-btn"
                                aria-label="Decrease weight"
                                onClick={() =>
                                  updateWeight(
                                    line.lineKey,
                                    formatWeight(Math.max(step, Number(line.weight) - step), step),
                                  )
                                }
                              >
                                −
                              </button>
                              <span className="weight-num">
                                {line.weight} {line.weightUnitLabel || "kg"}
                              </span>
                              <button
                                type="button"
                                className="weight-step-btn"
                                aria-label="Increase weight"
                                onClick={() =>
                                  updateWeight(line.lineKey, formatWeight(Number(line.weight) + step, step))
                                }
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="cart-item-controls">
                          {line.pricingMode === "fixed_weight" ? (
                            <span className="qty-locked">Qty: 1</span>
                          ) : (
                            <div className="qty-control">
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQty(line.lineKey, -1)}
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="qty-num">{line.qty}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                onClick={() => updateQty(line.lineKey, 1)}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          )}

                          <div className="cart-item-actions-row">
                            <button
                              type="button"
                              className="icon-action-btn save"
                              aria-label="Save for later"
                              onClick={() => {
                                saveForLater(line.lineKey);
                                showToast("Saved for later");
                              }}
                            >
                              <i className="far fa-heart" />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn remove"
                              aria-label="Remove item"
                              onClick={() => {
                                removeItem(line.lineKey);
                                showToast("Item removed");
                              }}
                            >
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="cart-item-subtotal">
                        <span className="label">Subtotal</span>
                        <span>{money(lineSubtotal(line))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <div className="summary-title">Order Summary</div>
                <div>
                  {items.map((line) => (
                    <div className="summary-row" key={line.lineKey}>
                      <span>
                        {line.name} × {line.qty}
                      </span>
                      <span>{money(lineSubtotal(line))}</span>
                    </div>
                  ))}
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <span className="amount">Rs. {total.toFixed(2)}</span>
                </div>
                <Link href="/checkout" className="btn-checkout">
                  <i className="fas fa-lock" /> Proceed to Checkout
                </Link>
                <Link href="/" className="btn-continue">
                  ← Continue Shopping
                </Link>

                <div className="trust-strip">
                  <div className="trust-item">
                    <i className="fas fa-leaf" /> Fresh, farm-picked quality
                  </div>
                  <div className="trust-item">
                    <i className="fas fa-shield-halved" /> Secure &amp; simple checkout
                  </div>
                  <div className="trust-item">
                    <i className="fab fa-whatsapp" /> Order help on WhatsApp
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {itemCount === 0 && (
          <div className="cart-empty">
            <div className="empty-badge">
              <i className="fas fa-basket-shopping" />
            </div>
            <h2>Your cart is empty</h2>
            <p>Let&apos;s fill it with something fresh from the farm.</p>
            <Link href="/" className="btn-browse">
              <i className="fas fa-leaf" /> Browse Products
            </Link>
          </div>
        )}

        {saved.length > 0 && (
          <div className="saved-section">
            <h2 className="saved-title">
              <i className="fas fa-heart" /> Saved for Later (<span>{saved.length}</span>)
            </h2>
            <div className="saved-grid">
              {saved.map((line) => (
                <div className="saved-card" key={line.lineKey}>
                  <div className="saved-card-img">
                    {line.image && (
                      <Image src={line.image} alt={line.name} width={200} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <button
                      type="button"
                      className="btn-remove-saved"
                      title="Remove"
                      onClick={() => removeSaved(line.lineKey)}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                  <div className="saved-card-body">
                    <div className="saved-card-name">{line.name}</div>
                    <div className="saved-card-price">Rs. {line.price}</div>
                    <div className="saved-card-actions">
                      <button
                        type="button"
                        className="btn-move-cart"
                        onClick={() => {
                          moveToCart(line.lineKey);
                          showToast("Moved to cart");
                        }}
                      >
                        <i className="fas fa-cart-plus" /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoggedIn && wishlistItems.length > 0 && (
          <div className="saved-section">
            <h2 className="saved-title">
              <i className="fas fa-heart" /> My Wishlist (<span>{wishlistItems.length}</span>)
            </h2>
            <div className="saved-grid">
              {wishlistItems.map((item) => {
                const busy = wishlistBusyIds.has(item.product.id);
                return (
                  <div className="saved-card" key={item.id}>
                    <div className="saved-card-img">
                      {item.product.main_image && (
                        <Image
                          src={item.product.main_image}
                          alt={item.product.name}
                          width={200}
                          height={120}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <button
                        type="button"
                        className="btn-remove-saved"
                        title="Remove"
                        disabled={busy}
                        onClick={() => handleWishlistRemove(item)}
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                    <div className="saved-card-body">
                      <div className="saved-card-name">{item.product.name}</div>
                      <div className="saved-card-price">Rs. {item.product.price}</div>
                      <div className="saved-card-actions">
                        <button
                          type="button"
                          className="btn-move-cart"
                          disabled={busy}
                          onClick={() => handleWishlistMoveToCart(item)}
                        >
                          <i className="fas fa-cart-plus" /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="reco-section">
            <h2 className="reco-title">
              <i className="fas fa-star" /> You might also like
            </h2>
            <div className="reco-scroll">
              {recommended.map((product) => {
                const variants = product.variants.filter((v) => v.is_available);
                const showVariantSelect = product.pricing_mode === "fixed_weight" && variants.length > 1;
                return (
                  <div className="reco-card" key={product.id}>
                    <Link href={`/product/${product.slug}`} className="reco-card-img">
                      {product.main_image && (
                        <Image src={product.main_image} alt={product.name} width={200} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </Link>
                    <div className="reco-card-body">
                      <Link href={`/product/${product.slug}`} className="reco-card-name">
                        {product.name}
                      </Link>
                      {showVariantSelect ? (
                        <>
                          <select
                            className="reco-variant-select"
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
                          <div className="reco-card-price">{variants.length} sizes</div>
                        </>
                      ) : (
                        <div className="reco-card-price">
                          Rs. {product.price} <span className="unit">{product.price_unit}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn-reco-add"
                        onClick={() => {
                          const chosen = showVariantSelect
                            ? variants.find((v) => v.id === (variantChoice[product.id] ?? variants[0].id))
                            : undefined;
                          addItem(product, { variant: chosen ?? null });
                          showToast(`${product.name} added to cart`);
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div id="cartToast" className={toast ? "show" : undefined}>
        <i className="fas fa-check-circle" /> <span>{toast}</span>
      </div>
    </>
  );
}
