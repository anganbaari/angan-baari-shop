import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductBySlug } from "@/lib/api";

const MAIN_SITE_URL = "https://anganbaari.pythonanywhere.com";

const ORIGIN_LABEL: Record<string, string> = {
  farm: "Grown/raised on our farm",
  sourced: "Sourced from other Nepali producers",
};

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

  const mainSiteUrl = `${MAIN_SITE_URL}/product/${product.slug}/`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        <div
          className={`relative aspect-square w-full overflow-hidden rounded-2xl bg-mist ${
            product.is_available ? "" : "opacity-60 grayscale"
          }`}
        >
          {product.main_image ? (
            <Image
              src={product.main_image}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              No image
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link
              href={`/?category=${product.category.id}`}
              className="text-sm font-medium tracking-wide text-moss uppercase"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-1 font-display text-3xl font-semibold text-forest sm:text-4xl">
            {product.name}
          </h1>

          {!product.is_available && (
            <span className="mt-2 inline-block rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream">
              Out of stock
            </span>
          )}

          <p className="mt-4 text-text-muted">{product.description}</p>

          <div className="mt-6 rounded-xl border border-mist bg-white p-4">
            <PricingDetail product={product} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full bg-forest px-6 py-3 text-center font-medium text-cream transition hover:bg-moss"
            >
              Continue on Angan Baari to order →
            </a>
            <a
              href={mainSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-full border border-forest px-6 py-3 text-center font-medium text-forest transition hover:border-moss hover:text-moss"
            >
              Buy Now on Angan Baari →
            </a>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            This is a browse-only preview — cart and checkout happen on the main Angan Baari site.
          </p>

          <dl className="mt-8 space-y-2 text-sm text-text-muted">
            {product.season && (
              <div className="flex gap-2">
                <dt className="font-medium text-forest">Season:</dt>
                <dd>{product.season}</dd>
              </div>
            )}
            {product.farming_method && (
              <div className="flex gap-2">
                <dt className="font-medium text-forest">Farming method:</dt>
                <dd>{product.farming_method}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="font-medium text-forest">Origin:</dt>
              <dd>{ORIGIN_LABEL[product.origin] ?? product.origin}</dd>
            </div>
          </dl>
        </div>
      </div>

      {product.detail_description && (
        <div className="mt-12 max-w-3xl">
          <h2 className="font-display text-2xl font-semibold text-forest">More about this product</h2>
          <p className="mt-3 whitespace-pre-line text-text-muted">{product.detail_description}</p>
        </div>
      )}
    </div>
  );
}

function PricingDetail({
  product,
}: {
  product: NonNullable<Awaited<ReturnType<typeof fetchProductBySlug>>>;
}) {
  if (product.pricing_mode === "fixed_quantity") {
    return (
      <p className="text-xl font-semibold text-forest">
        Rs. {product.price} <span className="text-sm font-normal text-text-muted">{product.price_unit}</span>
      </p>
    );
  }

  if (product.pricing_mode === "variable_weight") {
    return (
      <div>
        <p className="text-xl font-semibold text-forest">
          Rs. {product.price}{" "}
          <span className="text-sm font-normal text-text-muted">per {product.weight_unit_label}</span>
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Sold in steps of {product.weight_step} {product.weight_unit_label}
        </p>
      </div>
    );
  }

  // fixed_weight
  if (product.variants.length === 0) {
    return (
      <p className="text-xl font-semibold text-forest">
        {product.locked_total_price ? `Rs. ${product.locked_total_price}` : "Price on request"}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-forest">Available sizes</p>
      <ul className="divide-y divide-mist">
        {product.variants.map((variant) => (
          <li key={variant.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-text-muted">
              {variant.weight} kg{variant.label ? ` — ${variant.label}` : ""}
            </span>
            <span className="font-medium text-forest">Rs. {variant.total_price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
