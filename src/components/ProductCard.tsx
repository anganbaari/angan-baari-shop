"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getCardPriceLines } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { wishlistToggle } from "@/lib/profile";

/**
 * Ported from shop.html's .p-card: the whole card navigates to the product
 * on click (matches the original's div onclick="window.location=...") while
 * the View/Add buttons and wishlist heart stop that click from bubbling, so
 * they act independently — not a single card-wide link.
 */
export default function ProductCard({
  product,
  onToast,
}: {
  product: Product;
  onToast?: (message: string) => void;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isLoggedIn } = useAuth();
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const availableVariants = product.variants.filter((v) => v.is_available);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(
    availableVariants[0]?.id,
  );
  const priceLines = getCardPriceLines(product);
  const unavailableLabel = product.season ? "Out of Season" : "Out of Stock";

  function handleAdd() {
    const variant = availableVariants.find((v) => v.id === selectedVariantId);
    addItem(product, { variant: variant ?? null });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
    onToast?.(`${product.name} added to cart`);
  }

  /** Wishlist rows belong to a real user account (no session-based wishlist
   * for guests, unlike the cart) — so an anonymous visitor gets sent to log
   * in first, same as shop.html's own toggleWishlist() does on its
   * needsLogin branch. */
  async function handleWishClick() {
    if (!isLoggedIn) {
      onToast?.("Please log in to save items to your wishlist");
      window.setTimeout(() => router.push("/login?next=/"), 1200);
      return;
    }
    if (wishBusy) return;
    setWishBusy(true);
    try {
      const variantId = product.pricing_mode === "fixed_weight" ? selectedVariantId : undefined;
      const result = await wishlistToggle(product.id, variantId);
      setWished(result.is_saved);
      onToast?.(result.is_saved ? "Saved to wishlist" : "Removed from wishlist");
    } catch {
      onToast?.("Something went wrong — please try again");
    } finally {
      setWishBusy(false);
    }
  }

  return (
    <div
      className="p-card"
      onClick={() => router.push(`/product/${product.slug}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/product/${product.slug}`);
      }}
    >
      <div className="p-card-img">
        {product.main_image ? (
          <Image src={product.main_image} alt={product.name} fill sizes="(min-width: 600px) 25vw, 45vw" />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0ece4",
            }}
          >
            <i className="fas fa-seedling" style={{ fontSize: "2rem", color: "#9ab8a0" }} />
          </div>
        )}
        {!product.is_available && <span className="p-unavailable-badge">{unavailableLabel}</span>}
        <button
          type="button"
          className={`p-wish${wished ? " wished" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            void handleWishClick();
          }}
          title="Save for later"
        >
          <i className={`${wished ? "fas" : "far"} fa-heart`} />
        </button>
      </div>

      <div className="p-card-body">
        <div className="p-name">{product.name}</div>

        {priceLines.tbd ? (
          <div className="p-price-tbd">Price on request</div>
        ) : (
          <>
            <div className="p-price">{priceLines.primary}</div>
            <div className="p-price-unit">{priceLines.secondary}</div>
          </>
        )}

        <div className="p-badges-row">
          <span className="p-organic-badge">
            <i className="fas fa-leaf" /> Organic
          </span>
          {product.origin === "farm" ? (
            <span className="p-origin-badge p-origin-farm">
              <i className="fas fa-tractor" /> Our Farm
            </span>
          ) : (
            <span className="p-origin-badge p-origin-sourced">
              <i className="fas fa-map-marker-alt" /> Sourced
            </span>
          )}
        </div>

        {product.pricing_mode === "fixed_weight" && availableVariants.length > 1 && (
          <select
            className="card-variant-select"
            value={selectedVariantId}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSelectedVariantId(Number(e.target.value))}
          >
            {availableVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {Number(v.weight).toFixed(2)} kg — Rs. {Math.round(Number(v.total_price))}
                {v.label ? ` (${v.label})` : ""}
              </option>
            ))}
          </select>
        )}

        <div className="p-card-actions" onClick={(e) => e.stopPropagation()}>
          <Link href={`/product/${product.slug}`} className="btn-detail">
            <i className="fas fa-eye" /> View
          </Link>
          {product.is_available ? (
            <button
              type="button"
              className={`btn-order${added ? " is-added" : ""}`}
              style={{ flex: 1 }}
              onClick={handleAdd}
            >
              <i className={added ? "fas fa-check" : "fas fa-cart-plus"} /> {added ? "Added" : "Add"}
            </button>
          ) : (
            <button type="button" className="btn-order disabled" disabled>
              {product.season ? (
                <>
                  <i className="fas fa-leaf" /> Out of Season
                </>
              ) : (
                <>
                  <i className="fas fa-box" /> Out of Stock
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
