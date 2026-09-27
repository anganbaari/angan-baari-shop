"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getCardPriceLines } from "@/lib/pricing";

const MAIN_SITE_URL = "https://anganbaari.pythonanywhere.com";

/**
 * Ported from shop.html's .p-card: the whole card navigates to the product
 * on click (matches the original's div onclick="window.location=...") while
 * the View/Add buttons and wishlist heart stop that click from bubbling, so
 * they act independently — not a single card-wide link.
 */
export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [wished, setWished] = useState(false);
  const priceLines = getCardPriceLines(product);
  const unavailableLabel = product.season ? "Out of Season" : "Out of Stock";

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
            setWished((w) => !w);
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

        {product.pricing_mode === "fixed_weight" && product.variants.length > 1 && (
          <select className="card-variant-select" onClick={(e) => e.stopPropagation()}>
            {product.variants.map((v) => (
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
            <a
              href={`${MAIN_SITE_URL}/product/${product.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-order"
              style={{ flex: 1 }}
            >
              <i className="fas fa-cart-plus" /> Add
            </a>
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
