import "@/styles/cart.css";
import type { Metadata } from "next";
import { fetchProducts } from "@/lib/api";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Cart | Angan Baari",
};

// Without this the route has no dynamic API to force it, so Next prerenders
// it and bakes the recommendation pool in at build time — stale products
// until the next deploy. The rest of the app's data pages are all
// server-rendered per request; keep this one consistent.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  // Recommendation pool is fetched server-side; CartView filters out whatever
  // is already in the cart (cart state only exists on the client).
  const allProducts = await fetchProducts();
  const recommendPool = allProducts.filter((p) => p.is_available);

  return <CartView recommendPool={recommendPool} />;
}
