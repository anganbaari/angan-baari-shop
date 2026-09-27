"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import NepalFlagCanvas from "./NepalFlagCanvas";
import HoneycombNav from "./HoneycombNav";

/**
 * The .navbar is position:fixed (see site.css), so page content needs a
 * top offset equal to its real rendered height or it gets covered. The
 * reference site solves this the same way (shop.html's syncStickyOffsets):
 * measure the navbar after mount/resize/font-load and push the offset onto
 * body as inline padding, rather than guessing a static px value that would
 * drift out of sync with font-loading reflow or responsive breakpoints.
 */
export default function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    function syncOffset() {
      if (!header) return;
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.body.style.paddingTop = `${height}px`;
    }

    syncOffset();
    window.addEventListener("resize", syncOffset);
    window.addEventListener("load", syncOffset);
    if (document.fonts?.ready) {
      document.fonts.ready.then(syncOffset);
    }

    return () => {
      window.removeEventListener("resize", syncOffset);
      window.removeEventListener("load", syncOffset);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="navbar navbar-app scrolled"
      id="navbar"
      data-nav-mode="solid"
    >
      <div className="navbar-inner">
        <Link href="/" className="brand" aria-label="Angan Baari Home">
          <span className="brand-icon">
            <img
              src="https://ik.imagekit.io/anganbaari/angan-baari/site-images/logo-icon_0PorSdbpKy.png"
              alt=""
              width={84}
              height={84}
              loading="eager"
            />
          </span>
          <div className="brand-text">
            <span className="brand-name">आँगन बारी</span>
            <span className="brand-tagline">Angan Baari</span>
            <span className="brand-subtag">Organic Farm</span>
          </div>
          <span className="brand-flag" aria-hidden="true">
            <NepalFlagCanvas />
          </span>
        </Link>

        <HoneycombNav variant="desktop" />
      </div>
    </header>
  );
}
