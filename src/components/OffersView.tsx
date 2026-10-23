"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ComboBundle, DiscountOffer } from "@/lib/types";
import { fetchProductBySlug } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { fetchLiveCoupons, type Coupon } from "@/lib/profile";

// Prices come from the API as decimal strings ("102.00", "21015.0000");
// Number() only drops the trailing zeros, nothing is rounded.
const fmt = (value: string) => String(Number(value));

// Pinned to Nepal time so the server render and the browser agree.
function formatEnd(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kathmandu",
  });
}

/**
 * Ported from reference/offers.html. Everyone can see the offers; only
 * logged-in customers get the offer price (applied by the server when the
 * cart is quoted), so guests see "Log in to get this offer" instead of an
 * add-to-cart button. Combos are display-only and are ordered over WhatsApp.
 * Skipped: the festival countdown timer and the "how it works" strip.
 */
export default function OffersView({
  discountOffers,
  comboBundles,
  failed,
}: {
  discountOffers: DiscountOffer[];
  comboBundles: ComboBundle[];
  failed: boolean;
}) {
  const { isLoggedIn } = useAuth();
  const { addItem } = useCart();

  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  // /coupons/ is token-only, so guests simply don't get the strip.
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchLiveCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]));
  }, [isLoggedIn]);

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1600);
    });
  }

  // Same add-to-cart as the product page, with its defaults (smallest
  // weight step / cheapest size / quantity 1). The cart line carries the
  // normal price; the offer price is applied by the server quote.
  async function handleAdd(offer: DiscountOffer) {
    if (busyId !== null) return;
    setBusyId(offer.id);
    try {
      const product = await fetchProductBySlug(offer.slug);
      if (!product || !product.is_available) {
        showToast("Sorry, this product is not available right now.");
        return;
      }
      addItem(product);
      showToast(`${offer.name} added to cart`);
    } catch {
      showToast("Could not add this item right now — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const nothingLive = discountOffers.length === 0 && comboBundles.length === 0;

  return (
    <>
      <section className="ofr-hero">
        <span className="ofr-hero-badge">
          <i className="fas fa-leaf" /> Fresh Organic Offers — New Deals Every Season
        </span>
        <h1>Festival Offers</h1>
        <p>Limited-time prices straight from Bhulka Danda to your door.</p>
      </section>

      <div className="ofr-wrap">
        {coupons.map((coupon) => (
          <div className="ofr-coupon-strip" key={coupon.id}>
            <div className="ofr-coupon-icon">🎁</div>
            <div className="ofr-coupon-text">
              <h3>{coupon.festival_name || "Special"} Coupon Code</h3>
              <p>
                {coupon.discount_type === "percent"
                  ? `${Math.round(Number(coupon.discount_value))}% off`
                  : `Rs. ${Math.round(Number(coupon.discount_value))} off`}
                {coupon.description ? ` — ${coupon.description}` : ""}
              </p>
            </div>
            <div className="ofr-coupon-box">
              <div className="ofr-coupon-code">{coupon.code}</div>
              <button type="button" className="ofr-btn-copy" onClick={() => handleCopy(coupon.code)}>
                <i className={copiedCode === coupon.code ? "fas fa-check" : "fas fa-copy"} />{" "}
                {copiedCode === coupon.code ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ))}

        {failed && (
          <div className="ofr-empty">
            <i className="fas fa-triangle-exclamation" />
            <p>We couldn&apos;t load the offers right now. Please try again in a moment.</p>
          </div>
        )}

        {!failed && nothingLive && (
          <div className="ofr-empty">
            <i className="fas fa-tag" />
            <p>No offers are live right now. Check back soon!</p>
            <Link href="/" className="ofr-btn-shop">
              <i className="fas fa-store" /> Browse the shop
            </Link>
          </div>
        )}

        {discountOffers.length > 0 && (
          <>
            <div className="ofr-section-head">
              <div className="ofr-line" />
              <span className="ofr-section-label">🏷️ Seasonal Discounts</span>
              <div className="ofr-line right" />
            </div>
            <h2 className="ofr-section-title">Special Price Offers</h2>
            <p className="ofr-section-sub">Fresh from our farm — limited-time pricing on selected products</p>

            <div className="ofr-grid">
              {discountOffers.map((offer) => {
                const ends = formatEnd(offer.end_date);
                return (
                  <div className="ofr-card" key={offer.id}>
                    <div className="ofr-ribbon">-{offer.discount_percent}%</div>
                    <div className="ofr-card-img">
                      {offer.image ? (
                        <Image src={offer.image} alt={offer.name} width={300} height={200} />
                      ) : (
                        <div className="ofr-no-img">
                          <i className="fas fa-seedling" />
                        </div>
                      )}
                    </div>
                    <div className="ofr-card-body">
                      <div className="ofr-name">{offer.name}</div>
                      <div className="ofr-prices">
                        <span className="ofr-price-new">Rs. {fmt(offer.offer_price)}</span>
                        <span className="ofr-price-old">Rs. {fmt(offer.original_price)}</span>
                      </div>
                      <div className="ofr-unit">{offer.price_unit}</div>
                      {ends && <div className="ofr-ends">Ends on {ends}</div>}
                      <div className="ofr-actions">
                        <Link href={`/product/${offer.slug}`} className="ofr-btn-detail">
                          Link to product
                        </Link>
                        {!offer.is_available ? (
                          <button type="button" className="ofr-btn-add" disabled>
                            Out of stock
                          </button>
                        ) : isLoggedIn ? (
                          <button
                            type="button"
                            className="ofr-btn-add"
                            disabled={busyId === offer.id}
                            onClick={() => handleAdd(offer)}
                          >
                            <i className={busyId === offer.id ? "fas fa-spinner fa-spin" : "fas fa-cart-plus"} /> Add
                            to cart
                          </button>
                        ) : (
                          <Link href="/login?next=/offers" className="ofr-btn-add ofr-btn-login">
                            Log in to get this offer
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {comboBundles.length > 0 && (
          <>
            <div className="ofr-section-head">
              <div className="ofr-line" />
              <span className="ofr-section-label">🎁 Bundle Deals</span>
              <div className="ofr-line right" />
            </div>
            <h2 className="ofr-section-title">Combo Packages</h2>
            <p className="ofr-section-sub">Save more when you buy together — perfect gift sets</p>

            <div className="ofr-bundle-grid">
              {comboBundles.map((bundle) => {
                const ends = formatEnd(bundle.end_date);
                return (
                  <div className="ofr-bundle" key={bundle.id}>
                    {bundle.banner_image && (
                      <Image
                        className="ofr-bundle-banner"
                        src={bundle.banner_image}
                        alt={bundle.title}
                        width={480}
                        height={200}
                      />
                    )}
                    <div className="ofr-bundle-title">{bundle.title}</div>
                    {bundle.description && <div className="ofr-bundle-sub">{bundle.description}</div>}
                    <div className="ofr-bundle-items">
                      {bundle.items.map((item, i) => (
                        <div className="ofr-bundle-item" key={i}>
                          <i className="fas fa-check-circle" />
                          <span className="ofr-bundle-item-name">{item.name}</span>
                          <span className="ofr-bundle-item-qty">{fmt(item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="ofr-bundle-pricing">
                      <span className="ofr-bundle-new">Rs. {fmt(bundle.combo_price)}</span>
                      <span className="ofr-bundle-old">Rs. {fmt(bundle.original_price)}</span>
                      <span className="ofr-bundle-tag">Save {bundle.savings_percent}%</span>
                    </div>
                    {ends && <div className="ofr-ends">Ends on {ends}</div>}
                    <a
                      href={`https://wa.me/9779821025084?text=${encodeURIComponent(bundle.whatsapp_message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ofr-btn-bundle"
                    >
                      <i className="fab fa-whatsapp" /> Order on WhatsApp
                    </a>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className={`ofr-toast${toast ? " show" : ""}`} role="status">
        <i className="fas fa-check-circle" /> <span>{toast}</span>
      </div>
    </>
  );
}
