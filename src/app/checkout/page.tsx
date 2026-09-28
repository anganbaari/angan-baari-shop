import "@/styles/cart.css";
import "@/styles/checkout.css";
import type { Metadata } from "next";
import { fetchProducts } from "@/lib/api";
import CheckoutView from "@/components/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout | Angan Baari",
};

// Same reason as the cart page: keep the recommendation pool live rather
// than baked in at build time.
export const dynamic = "force-dynamic";

// cart.css is imported here too: checkout's empty-cart state reuses the
// cart page's own .cart-empty / .btn-browse styles.
export default async function CheckoutPage() {
  const allProducts = await fetchProducts();
  const recommendPool = allProducts.filter((p) => p.is_available);

  return <CheckoutView recommendPool={recommendPool} />;
}
