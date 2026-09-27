import "@/styles/shop.css";
import { fetchCategories, fetchProducts } from "@/lib/api";
import ShopPage from "@/components/ShopPage";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  // Fetches the FULL unfiltered catalog rather than using the API's own
  // ?category= filter: that filter is an exact category match only, while
  // the real shop page's sidebar counts and category filtering both need to
  // include subcategory products too (see lib/categories.ts) — easiest and
  // most correct to filter client-side against one full product list.
  const [categories, allProducts] = await Promise.all([fetchCategories(), fetchProducts()]);

  const selectedCategoryId = cat ? Number(cat) : undefined;

  return (
    <ShopPage
      categories={categories}
      allProducts={allProducts}
      selectedCategoryId={selectedCategoryId}
    />
  );
}
