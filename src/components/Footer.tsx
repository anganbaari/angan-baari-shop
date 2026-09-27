const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/anganbaari/" },
  { label: "Instagram", href: "https://www.instagram.com/anganbaari/" },
  { label: "YouTube", href: "https://www.youtube.com/@AnganBaari" },
  { label: "X", href: "https://x.com/anganbaari" },
  { label: "TikTok", href: "https://www.tiktok.com/@anganbaari" },
  { label: "Threads", href: "https://www.threads.com/@anganbaari" },
];

export default function Footer() {
  return (
    <footer className="border-t border-mist bg-forest text-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
        <p className="font-display text-xl">आँगन बारी</p>
        <p className="text-sm tracking-widest uppercase text-mist">Angan Baari</p>
        <p className="mt-1 text-sm text-mist">Fresh &middot; Organic &middot; Sustainable</p>

        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/80 transition hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="mt-8 text-xs text-cream/70">
          &copy; Since 2015. आँगन बारी/Angan Baari &mdash; Bhulka Danda, Rupandehi, Nepal &mdash;
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}
