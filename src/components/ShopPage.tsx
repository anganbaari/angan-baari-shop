"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product } from "@/lib/types";
import { buildCategoryTree, getCategoryAndDescendantIds } from "@/lib/categories";
import ShopSidebar from "./ShopSidebar";
import ProductCard from "./ProductCard";
import WhatsAppFloat from "./WhatsAppFloat";

type SortValue = "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc";

export default function ShopPage({
  categories,
  allProducts,
  selectedCategoryId,
}: {
  categories: Category[];
  allProducts: Product[];
  selectedCategoryId?: number;
}) {
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [searchBarHeight, setSearchBarHeight] = useState(56);

  // Same idea as shop.html's syncStickyOffsets(): measure the real,
  // already-rendered navbar (from the shared Header) and this page's own
  // search bar, so both stay pixel-correct across breakpoints and font
  // reflow. Header.tsx already sets body's own padding-top to the navbar's
  // height for every page — this only adds the search bar's own height on
  // top of that, specifically on this page, rather than duplicating navbar
  // measurement logic inside the frozen Header component.
  useEffect(() => {
    function sync() {
      const navbar = document.getElementById("navbar");
      if (navbar) setNavbarHeight(Math.ceil(navbar.getBoundingClientRect().height));
      if (searchBarRef.current) {
        setSearchBarHeight(Math.ceil(searchBarRef.current.getBoundingClientRect().height));
      }
    }
    sync();
    window.addEventListener("resize", sync);
    if (document.fonts?.ready) document.fonts.ready.then(sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("default");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(text: string) {
    setToast(text);
    window.setTimeout(() => setToast(null), 1800);
  }

  const categoryTree = useMemo(() => buildCategoryTree(categories, allProducts), [categories, allProducts]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategoryId === undefined) return allProducts;
    const ids = new Set(getCategoryAndDescendantIds(selectedCategoryId, categories));
    return allProducts.filter((p) => p.category && ids.has(p.category.id));
  }, [allProducts, categories, selectedCategoryId]);

  // Search + sort are pure client-side re-filter/reorder of the
  // already-category-filtered set, matching shop.html's filterAndSort() —
  // no new page navigation or data fetch for either.
  const visibleProducts = useMemo(() => {
    const term = search.toLowerCase().trim();
    let visible = categoryFiltered.filter((p) => p.name.toLowerCase().includes(term));
    if (sort === "name-asc") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name-desc") visible = [...visible].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "price-asc") visible = [...visible].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") visible = [...visible].sort((a, b) => Number(b.price) - Number(a.price));
    return visible;
  }, [categoryFiltered, search, sort]);

  return (
    <>
      <div className="shop-search-bar" ref={searchBarRef} style={{ top: navbarHeight }}>
        <div className="search-bar-inner">
          <div className="search-field">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Search fruits, vegetables, honey…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="sort-select-styled"
            title="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
          >
            <option value="default">Sort: Default</option>
            <option value="name-asc">Name: A–Z</option>
            <option value="name-desc">Name: Z–A</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
          <span className="results-count">
            {visibleProducts.length} product{visibleProducts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="shop-wrapper" style={{ marginTop: searchBarHeight }}>
        <ShopSidebar
          tree={categoryTree}
          allCategories={categories}
          totalCount={allProducts.length}
          selectedCategoryId={selectedCategoryId}
        />

        <main className="shop-main">
          <div className="shop-banner">
            <div className="banner-text">
              <h2>Fresh From Our Farm 🌿</h2>
              <p>Organic produce from Bhulka Danda, Rupandehi, Nepal</p>
            </div>
            <div className="banner-emoji">🌱</div>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="no-results" style={{ display: "block" }}>
              <i className="fas fa-search" />
              <p>No products found. Try a different search.</p>
            </div>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} onToast={showToast} />
              ))}
            </div>
          )}
        </main>
      </div>

      <WhatsAppFloat message="Hello Angan Baari! I would like to order." />

      <div id="shopToast" className={toast ? "show" : undefined}>
        <i className="fas fa-check-circle" /> <span>{toast}</span>
      </div>
    </>
  );
}
