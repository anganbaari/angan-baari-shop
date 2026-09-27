const MAIN_SITE_URL = "https://anganbaari.pythonanywhere.com";

type NavCell = {
  key: string;
  href: string;
  label: string;
  offer?: boolean;
  icon: React.ReactNode;
};

// Same 5 cells as every app page (shop/cart/offers/profile/product_detail)
// in reference/*.html: Shop, Cart, Offers, Login-or-Profile, Website. This
// Next.js app has no cart/offers/login of its own yet, so those three link
// out to the existing Django site — matching the "continue on Angan Baari"
// pattern already used on the product detail page. No cart badge yet either,
// since there's no session cart here to read a count from.
const CELLS: NavCell[] = [
  {
    key: "shop",
    href: "/",
    label: "Shop",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4.5 9h15l-1.4 10.2a2 2 0 01-2 1.8H7.9a2 2 0 01-2-1.8L4.5 9z" />
        <path d="M8.5 9V7a3.5 3.5 0 017 0v2" />
      </svg>
    ),
  },
  {
    key: "cart",
    href: `${MAIN_SITE_URL}/cart/`,
    label: "Cart",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3h2.4l2.1 11.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6.2" />
      </svg>
    ),
  },
  {
    key: "offers",
    href: `${MAIN_SITE_URL}/offers/`,
    label: "Offers",
    offer: true,
    icon: (
      <svg className="offer-flame" viewBox="0 0 24 24">
        <path d="M12 2c2 3 5 6 5 10a5 5 0 01-10 0c0-1.8.8-3 1.6-4-.1 1.6 1 2.3 1.7 1.2C9.6 7 10 4 12 2z" />
      </svg>
    ),
  },
  {
    key: "login",
    href: `${MAIN_SITE_URL}/account/login/`,
    label: "Login",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7" />
      </svg>
    ),
  },
  {
    key: "website",
    href: MAIN_SITE_URL,
    label: "Website",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9S9.5 5.7 12 3z" />
      </svg>
    ),
  },
];

const CONNECTOR_POSITIONS = [108, 240, 372, 504];

/** activeKey defaults to "shop" since this app is entirely the Shop section
 * today — matches how product_detail.html also keeps its Shop cell active. */
export default function HoneycombNav({
  variant,
  activeKey = "shop",
}: {
  variant: "desktop" | "mobile";
  activeKey?: string;
}) {
  const cells = (
    <div className="hc-scale-box hc-scale-box--app5">
      <div className="hc-strip hc-strip--cells5">
        <div className="hc-strip-bg" aria-hidden="true" />
        {CONNECTOR_POSITIONS.map((left) => (
          <div key={left} className="hc-connector" style={{ left }} aria-hidden="true" />
        ))}

        <ul className="hc-nav">
          {CELLS.map((cell) => (
            <li key={cell.key} className={`hc-cell${cell.offer ? " hc-cell--offer" : ""}`}>
              <a
                className={`hc-link${cell.key === activeKey ? " active" : ""}`}
                href={cell.href}
                data-target={`${cell.key}-cell`}
              >
                {cell.icon}
                <span className="hc-label">{cell.label}</span>
                <span className="hc-ping" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if (variant === "mobile") {
    return (
      <nav className="mobile-hc-nav" aria-label="Mobile navigation">
        {cells}
      </nav>
    );
  }

  return (
    <nav className="desktop-nav" aria-label="Main Navigation">
      {cells}
    </nav>
  );
}
