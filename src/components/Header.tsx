import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-mist bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-display text-2xl font-semibold text-forest">आँगन बारी</span>
          <span className="text-xs tracking-widest text-text-muted uppercase">Angan Baari</span>
        </Link>
        <a
          href="https://anganbaari.pythonanywhere.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-moss px-4 py-2 text-sm font-medium text-moss transition hover:bg-moss hover:text-cream"
        >
          Order on the main site →
        </a>
      </div>
    </header>
  );
}
