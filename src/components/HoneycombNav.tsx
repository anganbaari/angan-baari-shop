"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

const MAIN_SITE_URL = "https://anganbaari.pythonanywhere.com";

type NavCell = {
  key: string;
  href: string;
  label: string;
  offer?: boolean;
  internal?: boolean;
  icon: React.ReactNode;
};

const PERSON_ICON = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
  </svg>
);

// Same 5 cells as every app page (shop/cart/offers/profile/product_detail)
// in reference/*.html: Shop, Cart, Offers, Login-or-Profile, Website. Shop,
// Cart, Login and Profile are real routes here now; Offers still links out
// to the existing Django site (no Offers endpoint in this app yet).
const SHOP_CELL: NavCell = {
  key: "shop",
  href: "/",
  label: "Shop",
  internal: true,
  icon: (
    <svg viewBox="0 0 24 24">
      <path d="M4.5 9h15l-1.4 10.2a2 2 0 01-2 1.8H7.9a2 2 0 01-2-1.8L4.5 9z" />
      <path d="M8.5 9V7a3.5 3.5 0 017 0v2" />
    </svg>
  ),
};

const CART_CELL: NavCell = {
  key: "cart",
  href: "/cart",
  label: "Cart",
  internal: true,
  icon: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.4l2.1 11.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6.2" />
    </svg>
  ),
};

const OFFERS_CELL: NavCell = {
  key: "offers",
  href: `${MAIN_SITE_URL}/offers/`,
  label: "Offers",
  offer: true,
  icon: (
    <svg className="offer-flame" viewBox="0 0 24 24">
      <path d="M12 2c2 3 5 6 5 10a5 5 0 01-10 0c0-1.8.8-3 1.6-4-.1 1.6 1 2.3 1.7 1.2C9.6 7 10 4 12 2z" />
    </svg>
  ),
};

const WEBSITE_CELL: NavCell = {
  key: "website",
  href: MAIN_SITE_URL,
  label: "Website",
  icon: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3z" />
    </svg>
  ),
};

const CONNECTOR_POSITIONS = [108, 240, 372, 504];

/** Which cell is active, from the current route — matching what each
 * reference template hardcodes: product_detail.html keeps Shop active, and
 * both cart.html and checkout.html mark the Cart cell active. */
function activeKeyForPath(pathname: string): string {
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/order-confirmation")) {
    return "cart";
  }
  if (pathname.startsWith("/profile")) return "login";
  return "shop";
}

export default function HoneycombNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { isLoggedIn, user } = useAuth();
  const activeKey = activeKeyForPath(pathname ?? "/");

  // Matches the reference's {% if user.is_authenticated %} switch exactly:
  // logged out shows "Login" (external, no /login route existed there —
  // here it's this app's own real route); logged in shows the user's own
  // first name and links to /profile instead.
  const loginOrProfileCell: NavCell = isLoggedIn
    ? { key: "login", href: "/profile", label: user?.name.split(" ")[0] || "Profile", internal: true, icon: PERSON_ICON }
    : { key: "login", href: "/login", label: "Login", internal: true, icon: PERSON_ICON };

  const cells = [SHOP_CELL, CART_CELL, OFFERS_CELL, loginOrProfileCell, WEBSITE_CELL];

  const navMarkup = (
    <div className="hc-scale-box hc-scale-box--app5">
      <div className="hc-strip hc-strip--cells5">
        <div className="hc-strip-bg" aria-hidden="true" />
        {CONNECTOR_POSITIONS.map((left) => (
          <div key={left} className="hc-connector" style={{ left }} aria-hidden="true" />
        ))}

        <ul className="hc-nav">
          {cells.map((cell) => {
            const className = `hc-link${cell.key === activeKey ? " active" : ""}`;
            const inner = (
              <>
                {cell.icon}
                <span className="hc-label">{cell.label}</span>
                <span className="hc-ping" />
                {cell.key === "cart" && count > 0 && <span className="hc-cart-badge">{count}</span>}
              </>
            );

            return (
              <li key={cell.key} className={`hc-cell${cell.offer ? " hc-cell--offer" : ""}`}>
                {cell.internal ? (
                  <Link className={className} href={cell.href} data-target={`${cell.key}-cell`}>
                    {inner}
                  </Link>
                ) : (
                  <a className={className} href={cell.href} data-target={`${cell.key}-cell`}>
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <nav className="mobile-hc-nav" aria-label="Mobile navigation">
        {navMarkup}
      </nav>
    );
  }

  return (
    <nav className="desktop-nav" aria-label="Main Navigation">
      {navMarkup}
    </nav>
  );
}
