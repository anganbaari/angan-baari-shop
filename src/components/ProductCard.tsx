import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCardPriceLine } from "@/lib/pricing";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-mist bg-white transition hover:shadow-md ${
        product.is_available ? "" : "opacity-50 grayscale"
      }`}
    >
      <div className="relative aspect-square w-full bg-mist">
        {product.main_image ? (
          <Image
            src={product.main_image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No image
          </div>
        )}
        {!product.is_available && (
          <span className="absolute top-2 left-2 rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-forest group-hover:text-moss">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-text-muted">{formatCardPriceLine(product)}</p>
      </div>
    </Link>
  );
}
