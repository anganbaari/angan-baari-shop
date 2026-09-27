import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-forest">Product not found</h1>
      <p className="mt-3 text-text-muted">
        We couldn&apos;t find that product — it may have been removed or the link is out of date.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-forest px-6 py-3 font-medium text-cream transition hover:bg-moss"
      >
        Back to the shop
      </Link>
    </div>
  );
}
