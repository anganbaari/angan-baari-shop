import "@/styles/offers.css";
import type { Metadata } from "next";
import { fetchOffers } from "@/lib/api";
import type { OffersResponse } from "@/lib/types";
import OffersView from "@/components/OffersView";

export const metadata: Metadata = {
  title: "Festival Offers | Angan Baari",
  description:
    "Exclusive festival offers on fresh organic farm products from Angan Baari — honey, fruits, vegetables and more.",
};

// Offers change a few times a season; a minute of caching keeps the page
// fast without showing a stale offer for long. Cart totals never rely on
// this data — POST /cart/quote/ is the authority on price.
export const revalidate = 60;

export default async function OffersPage() {
  let offers: OffersResponse = { discount_offers: [], combo_bundles: [] };
  let failed = false;
  try {
    offers = await fetchOffers();
  } catch {
    failed = true;
  }

  return <OffersView discountOffers={offers.discount_offers} comboBundles={offers.combo_bundles} failed={failed} />;
}
