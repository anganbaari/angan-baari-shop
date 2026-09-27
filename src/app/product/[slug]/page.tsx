import "@/styles/product-detail.css";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProducts } from "@/lib/api";
import ProductDetailView from "@/components/ProductDetailView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    return { title: "Product not found | Angan Baari" };
  }
  return {
    title: `${product.name} | Angan Baari`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Same as product_detail.html's related_products: same category,
  // excluding this product, first 3.
  const allProducts = await fetchProducts();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category && product.category && p.category.id === product.category.id)
    .slice(0, 3);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
