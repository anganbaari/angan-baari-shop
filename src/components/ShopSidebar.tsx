"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryNode } from "@/lib/categories";
import { getAncestorIds } from "@/lib/categories";
import type { Category } from "@/lib/types";

function computeInitialExpanded(selectedCategoryId: number | undefined, allCategories: Category[]): Set<number> {
  if (selectedCategoryId === undefined) return new Set();
  return new Set([selectedCategoryId, ...getAncestorIds(selectedCategoryId, allCategories)]);
}

/**
 * Ported from shop.html's .shop-sidebar. The original's accordion toggle
 * click also happened to trigger real navigation (it's a plain <a href>) —
 * harmless there since a full page load followed immediately, but in this
 * app's client-side routing that combination would fight itself. Instead:
 * the link click just navigates (like a real link), and expand/collapse is
 * synced to whichever category is actually selected, plus a separate arrow
 * click for manual expand/collapse — same visual outcome, not a redesign.
 */
export default function ShopSidebar({
  tree,
  allCategories,
  totalCount,
  selectedCategoryId,
}: {
  tree: CategoryNode[];
  allCategories: Category[];
  totalCount: number;
  selectedCategoryId?: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(() =>
    computeInitialExpanded(selectedCategoryId, allCategories),
  );
  // Re-derive the expanded set whenever the selected category changes (e.g.
  // after navigating the sidebar), so it auto-opens down to the new
  // selection — React's recommended "adjust state during render" pattern
  // instead of a useEffect+setState round trip.
  const [prevSelectedCategoryId, setPrevSelectedCategoryId] = useState(selectedCategoryId);
  if (selectedCategoryId !== prevSelectedCategoryId) {
    setPrevSelectedCategoryId(selectedCategoryId);
    setExpanded(computeInitialExpanded(selectedCategoryId, allCategories));
  }

  function toggle(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="shop-sidebar">
      <div className="sidebar-box">
        <span className="sidebar-title">Categories</span>
        <ul className="cat-list">
          <li>
            <Link className={selectedCategoryId === undefined ? "active" : ""} href="/">
              <i className="fas fa-th-large" style={{ color: "#4a7c59", width: 14 }} />
              All Products
              <span className="cat-count">{totalCount}</span>
            </Link>
          </li>
          {tree.map((node) => (
            <CategoryItem key={node.category.id} node={node} level={1} expanded={expanded} onToggle={toggle} selectedCategoryId={selectedCategoryId} />
          ))}
        </ul>
      </div>
      <div className="sidebar-box">
        <span className="sidebar-title">Contact Us</span>
        <a
          href="https://wa.me/9779821025084"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#25D366",
            color: "white",
            padding: "9px 14px",
            borderRadius: 8,
            fontSize: "0.82rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <i className="fab fa-whatsapp" /> Order via WhatsApp
        </a>
      </div>
    </aside>
  );
}

function CategoryItem({
  node,
  level,
  expanded,
  onToggle,
  selectedCategoryId,
}: {
  node: CategoryNode;
  level: 1 | 2 | 3;
  expanded: Set<number>;
  onToggle: (id: number, e: React.MouseEvent) => void;
  selectedCategoryId?: number;
}) {
  const isActive = selectedCategoryId === node.category.id;
  const isOpen = expanded.has(node.category.id);
  const levelClass = level === 1 ? "cat-l1" : level === 2 ? "cat-l2" : "cat-l3";
  const iconClass = level === 1 ? `fas ${node.category.icon || "fa-leaf"}` : level === 2 ? "fas fa-leaf" : "fas fa-circle";
  const iconStyle =
    level === 1
      ? { width: 14 }
      : level === 2
        ? { width: 12, fontSize: "0.7rem" }
        : { width: 10, fontSize: "0.35rem", verticalAlign: "middle" as const };

  return (
    <li className={levelClass}>
      <Link className={`cat-toggle${isActive ? " active" : ""}`} href={`/?cat=${node.category.id}`}>
        <i className={iconClass} style={iconStyle} />
        {node.category.name}
        <span className="cat-count">{node.count}</span>
        {node.children.length > 0 && (
          <i
            className={`fas fa-chevron-right cat-arrow${isOpen ? " open" : ""}`}
            onClick={(e) => onToggle(node.category.id, e)}
          />
        )}
      </Link>
      {node.children.length > 0 && (
        <ul className="cat-sub" style={{ display: isOpen ? "block" : "none" }}>
          {node.children.map((child) => (
            <CategoryItem
              key={child.category.id}
              node={child}
              level={(level + 1) as 2 | 3}
              expanded={expanded}
              onToggle={onToggle}
              selectedCategoryId={selectedCategoryId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
