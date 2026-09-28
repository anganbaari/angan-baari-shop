"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product, ProductVariant } from "@/lib/types";
import { getDetailPriceLines } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import BilingualText from "./BilingualText";
import WhatsAppFloat from "./WhatsAppFloat";

type TabKey = "description" | "why-us" | "reviews";

/**
 * Ported from product_detail.html. Gaps vs. the real page, all because the
 * data simply isn't in the API yet (not a design choice):
 * - Reviews/ratings: no reviews endpoint exists at all — shows the same
 *   "No reviews yet" empty state the real page already has for zero
 *   reviews, and the review-submission form is left out entirely rather
 *   than wiring it to nothing.
 * - Discount badge: no Offers endpoint — never rendered (same as the real
 *   page when there's no active_offer).
 * - WhatsApp message: Product.whatsapp_message isn't in the serializer —
 *   falls back to a generic "I'm interested in {name}" message.
 * "Add to Cart" (both the main button and the sticky mobile bar) adds to
 * this app's own cart, carrying the chosen size pill / weight / quantity;
 * "Order via WhatsApp" is fully real.
 */
export default function ProductDetailView({
  product,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  // API already includes main_image as images[0] — render this wholesale,
  // never main_image separately, or the first photo duplicates.
  const images = product.images;

  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [wished, setWished] = useState(false);

  const availableVariants = useMemo(
    () => product.variants.filter((v) => v.is_available),
    [product.variants],
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    availableVariants[0],
  );

  const [qty, setQty] = useState(1);
  const [weight, setWeight] = useState(Number(product.weight_step || 0.5));

  const priceLines = getDetailPriceLines(product, selectedVariant);
  const whatsappMessage = `Hello Angan Baari! I'm interested in ${product.name}.`;

  // Add to cart, carrying whichever size pill / weight / quantity the
  // visitor actually chose above.
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem(product, {
      variant: selectedVariant ?? null,
      weight: product.pricing_mode === "variable_weight" ? weight.toFixed(2) : null,
      qty: product.pricing_mode === "fixed_quantity" ? qty : 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  // Sticky mobile add-to-cart bar: visible once the real order-buttons row
  // scrolls out of view, same as the original's IntersectionObserver.
  const orderButtonsRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const target = orderButtonsRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Back-to-top visibility.
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lightbox keyboard nav.
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setImageIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setImageIndex((i) => (i + 1) % images.length);
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, images.length]);

  const mainImage = images[imageIndex];

  return (
    <div className="product-page">
      <div className="product-grid">
        {/* Images */}
        <div className="product-images">
          <div className="main-image" onClick={() => images.length && setLightboxOpen(true)}>
            {mainImage ? (
              <Image src={mainImage} alt={product.name} fill sizes="(min-width: 900px) 45vw, 90vw" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fas fa-seedling" style={{ fontSize: "4rem", color: "var(--sage)" }} />
              </div>
            )}
            <div className="zoom-hint">
              <i className="fas fa-expand" />
            </div>
          </div>
          {images.length > 0 && (
            <div className="thumb-grid">
              {images.map((src, i) => (
                <div
                  key={src}
                  className={`thumb${i === imageIndex ? " active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageIndex(i);
                  }}
                >
                  <Image src={src} alt={product.name} width={200} height={200} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="product-info">
          <div className="info-top-row">
            <div className="product-badges">
              {product.origin === "farm" ? (
                <span className="badge-origin-farm">
                  <i className="fas fa-tractor" /> Grown on Our Farm
                </span>
              ) : (
                <span className="badge-origin-sourced">
                  <i className="fas fa-map-marker-alt" /> Sourced in Nepal
                </span>
              )}
            </div>
            <button
              type="button"
              className={`wishlist-btn${wished ? " active" : ""}`}
              onClick={() => setWished((w) => !w)}
              aria-label="Add to wishlist"
            >
              <i className={`${wished ? "fas" : "far"} fa-heart`} />
            </button>
          </div>

          <h1 className="product-name">{product.name}</h1>

          <div className="price-block">
            <span className="price-current">{priceLines.tbd ? "Price on request" : priceLines.primary}</span>
            {!priceLines.tbd && <span className="price-unit">{priceLines.secondary}</span>}
          </div>

          {product.pricing_mode === "fixed_weight" && availableVariants.length > 0 && (
            <div className="size-picker">
              <span className="size-picker-label">Choose this animal&apos;s weight</span>
              <div className="size-picker-pills">
                {availableVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`size-pill${selectedVariant?.id === v.id ? " active" : ""}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {Number(v.weight).toFixed(2)} kg{v.label ? <small> ({v.label})</small> : null}
                    <span className="size-pill-price">Rs. {Math.round(Number(v.total_price))}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-details-grid">
            {product.season && (
              <div className="detail-card">
                <i className="fas fa-calendar-alt" />
                <div>
                  <div className="detail-label">Season</div>
                  <div className="detail-value">{product.season}</div>
                </div>
              </div>
            )}
            {product.farming_method && (
              <div className="detail-card">
                <i className="fas fa-tractor" />
                <div>
                  <div className="detail-label">Farming</div>
                  <div className="detail-value">{product.farming_method}</div>
                </div>
              </div>
            )}
            <div className="detail-card">
              <i className="fas fa-map-marker-alt" />
              <div>
                <div className="detail-label">Location</div>
                <div className="detail-value">Bhulka Danda, Rupandehi</div>
              </div>
            </div>
            <div className="detail-card">
              <i className="fas fa-truck" />
              <div>
                <div className="detail-label">Delivery</div>
                <div className="detail-value">2–3.5 hours</div>
              </div>
            </div>
          </div>

          {product.is_available && (
            <>
              {product.pricing_mode === "variable_weight" ? (
                <div className="qty-row">
                  <span className="qty-label">Weight</span>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      aria-label="Decrease weight"
                      onClick={() =>
                        setWeight((w) => Math.max(Number(product.weight_step), w - Number(product.weight_step)))
                      }
                    >
                      −
                    </button>
                    <input type="text" readOnly value={weight.toFixed(2)} />
                    <button
                      type="button"
                      aria-label="Increase weight"
                      onClick={() => setWeight((w) => w + Number(product.weight_step))}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: 6 }}>
                    {product.weight_unit_label}
                  </span>
                </div>
              ) : product.pricing_mode === "fixed_weight" ? (
                <div className="qty-row">
                  <span className="qty-label">
                    <i className="fas fa-lock" /> Weight &amp; price are fixed per animal
                    {availableVariants.length > 0 ? " — pick a size above" : ""}
                  </span>
                </div>
              ) : (
                <div className="qty-row">
                  <span className="qty-label">Quantity</span>
                  <div className="qty-stepper">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                      −
                    </button>
                    <input type="number" readOnly value={qty} min={1} />
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}>
                      +
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="order-buttons" ref={orderButtonsRef}>
            {product.is_available && (
              <>
                {/* flex:1/min-width:0 replaces the reference's wrapping
                    <form id="cartForm">, which carried those same rules. */}
                <button
                  type="button"
                  className="btn-cart-product"
                  style={{ flex: 1, minWidth: 0 }}
                  onClick={handleAddToCart}
                >
                  <i className={added ? "fas fa-check" : "fas fa-cart-plus"} />{" "}
                  {added ? "Added to Cart" : "Add to Cart"}
                </button>
                <a
                  href={`https://wa.me/9779821025084?text=${encodeURIComponent(whatsappMessage)}`}
                  className="btn-wa-product"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-whatsapp" /> Order via WhatsApp
                </a>
              </>
            )}
          </div>

          <BilingualText text={product.description} className="product-desc" />

          <div className="trust-mini-row">
            <span className="trust-mini">
              <i className="fas fa-flask" /> No chemicals
            </span>
            <span className="trust-mini">
              <i className="fas fa-leaf" /> Eco packaging
            </span>
            <span className="trust-mini">
              <i className="fas fa-shield-alt" /> Quality assured
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-wrap">
        <div className="tabs-nav">
          <button
            className={`tab-btn${activeTab === "description" ? " active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            className={`tab-btn${activeTab === "why-us" ? " active" : ""}`}
            onClick={() => setActiveTab("why-us")}
          >
            Why Choose Us
          </button>
          <button
            className={`tab-btn${activeTab === "reviews" ? " active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

        <div className={`tab-panel${activeTab === "description" ? " active" : ""}`}>
          <div className="product-features">
            {product.detail_description ? (
              <>
                <h3 className="features-title">About this Product</h3>
                <BilingualText text={product.detail_description} />
              </>
            ) : (
              <BilingualText text={product.description} />
            )}
          </div>
        </div>

        <div className={`tab-panel${activeTab === "why-us" ? " active" : ""}`}>
          <div className="product-features">
            <h3 className="features-title">Why Choose Angan Baari?</h3>
            <div className="features-grid">
              <WhyUsItem icon="fa-flask" title="No Chemicals" desc="100% natural farming, zero synthetic pesticides or fertilizers." />
              <WhyUsItem icon="fa-sun" title="Naturally Ripened" desc="Harvested only when fully ripe — no artificial ripening." />
              <WhyUsItem icon="fa-truck" title="Farm Fresh" desc="Picked fresh and delivered to your door within hours." />
              <WhyUsItem icon="fa-leaf" title="Eco Packaging" desc="Packed in biodegradable, eco-friendly packaging." />
              <WhyUsItem icon="fa-heart" title="Grown with Love" desc="Every product is grown with care and dedication since 2015." />
              <WhyUsItem icon="fa-shield-alt" title="Quality Assured" desc="Carefully selected and inspected before delivery." />
            </div>
          </div>
        </div>

        <div className={`tab-panel${activeTab === "reviews" ? " active" : ""}`}>
          {/* No reviews API exists yet — same empty state the real page
              shows when review_count is 0. The review-submission form is
              left out rather than wired to nothing. */}
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="related-section">
          <h2 className="related-title">You May Also Like</h2>
          <div className="related-grid">
            {relatedProducts.map((related) => (
              <Link key={related.id} href={`/product/${related.slug}`} className="related-card">
                <div className="related-img">
                  {related.main_image ? (
                    <Image src={related.main_image} alt={related.name} width={400} height={300} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--mist)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fas fa-seedling" style={{ fontSize: "2rem", color: "var(--sage)" }} />
                    </div>
                  )}
                </div>
                <div className="related-body">
                  <div className="related-name">{related.name}</div>
                  <div className="related-link">
                    <i className="fas fa-arrow-right" /> Learn more
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {images.length > 0 && (
        <div
          className={`lightbox-overlay${lightboxOpen ? " open" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
        >
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close">
            <i className="fas fa-times" />
          </button>
          {images.length > 1 && (
            <button
              className="lightbox-nav lightbox-prev"
              onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
            >
              <i className="fas fa-chevron-left" />
            </button>
          )}
          {mainImage && <img src={mainImage} alt={product.name} />}
          {images.length > 1 && (
            <button
              className="lightbox-nav lightbox-next"
              onClick={() => setImageIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
            >
              <i className="fas fa-chevron-right" />
            </button>
          )}
        </div>
      )}

      {/* Sticky mobile add-to-cart bar */}
      {product.is_available && (
        <div className={`sticky-mobile-bar${stickyVisible ? " visible" : ""}`}>
          <div className="sticky-bar-price">
            <span className="cur">{priceLines.tbd ? "Price on request" : priceLines.primary}</span>
            {!priceLines.tbd && <span className="unit">{priceLines.secondary}</span>}
          </div>
          <button
            type="button"
            className="sticky-bar-btn"
            onClick={handleAddToCart}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className={added ? "fas fa-check" : "fas fa-cart-plus"} />{" "}
            {added ? "Added to Cart" : "Add to Cart"}
          </button>
        </div>
      )}

      {/* Floating buttons */}
      <Link href="/" className="float-shop" aria-label="Visit our online shop" title="Shop Now">
        <i className="fas fa-shopping-bag" />
        <span className="float-shop-tooltip">Visit Our Shop</span>
      </Link>
      <WhatsAppFloat message={whatsappMessage} />
      <button
        className={`back-to-top${showBackToTop ? " visible" : ""}`}
        aria-label="Back to top"
        title="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <i className="fas fa-chevron-up" />
      </button>
    </div>
  );
}

function WhyUsItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="feature-item">
      <div className="feature-icon">
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <div className="feature-title">{title}</div>
        <div className="feature-desc">{desc}</div>
      </div>
    </div>
  );
}
