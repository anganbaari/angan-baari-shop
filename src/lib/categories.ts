import type { Category, Product } from "./types";

export interface CategoryNode {
  category: Category;
  count: number;
  children: CategoryNode[];
}

/** All descendant ids (not including catId itself), any depth. */
function getDescendantIds(catId: number, all: Category[]): number[] {
  const directChildren = all.filter((c) => c.parent === catId);
  return directChildren.flatMap((c) => [c.id, ...getDescendantIds(c.id, all)]);
}

/** catId + every descendant id, any depth — matches the Django shop view's
 * get_all_ids(), used both for the sidebar counts and for filtering the
 * grid by category (a parent category's count/filter includes its
 * subcategories' products too). */
export function getCategoryAndDescendantIds(catId: number, all: Category[]): number[] {
  return [catId, ...getDescendantIds(catId, all)];
}

function countForCategory(catId: number, categories: Category[], products: Product[]): number {
  const ids = new Set(getCategoryAndDescendantIds(catId, categories));
  return products.filter((p) => p.category && ids.has(p.category.id)).length;
}

function buildNode(category: Category, categories: Category[], products: Product[]): CategoryNode {
  const children = categories
    .filter((c) => c.parent === category.id)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((c) => buildNode(c, categories, products));

  return {
    category,
    count: countForCategory(category.id, categories, products),
    children,
  };
}

/** Top-level category tree (parent === null), each node counting products
 * in itself + all descendants — matches shop.html's cat_tree/get_count(). */
export function buildCategoryTree(categories: Category[], products: Product[]): CategoryNode[] {
  return categories
    .filter((c) => c.parent === null)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((c) => buildNode(c, categories, products));
}

/** Ids of every ancestor of catId (parent, grandparent, ...), used to
 * auto-expand the sidebar accordion down to whichever category is active. */
export function getAncestorIds(catId: number, all: Category[]): number[] {
  const category = all.find((c) => c.id === catId);
  if (!category || category.parent === null) return [];
  return [category.parent, ...getAncestorIds(category.parent, all)];
}
