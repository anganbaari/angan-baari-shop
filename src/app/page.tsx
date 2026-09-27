import { fetchCategories, fetchProducts } from "@/lib/api";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts(category),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-forest sm:text-4xl">
        Fresh from our farm
      </h1>
      <p className="mt-2 max-w-2xl text-text-muted">
        Organic produce from Bhulka Danda, Rupandehi, Nepal.
      </p>

      <div className="mt-6">
        <CategoryFilter categories={categories} selectedCategoryId={category} />
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-text-muted">No products found in this category.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
