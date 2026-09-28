"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoneycombNav from "@/components/HoneycombNav";

/**
 * reference/forgot_password.html and reference/reset_password.html are
 * standalone documents in the real site — no navbar, no footer, just a
 * centred card. Every route in this app shares one root layout.tsx, so
 * there's no per-route way to opt out of Header/Footer/HoneycombNav short
 * of splitting the route tree into groups; this pathname check is the
 * lighter-weight equivalent, in the same spirit as HoneycombNav already
 * deriving its active state from usePathname().
 */
const STANDALONE_PREFIXES = ["/forgot-password", "/reset-password"];

function isStandalone(pathname: string) {
  return STANDALONE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = isStandalone(pathname ?? "");

  // Header measures its own (fixed-position) height on mount and pushes that
  // offset onto body as inline padding-top. It never mounts on a standalone
  // route, so nothing sets this — but a leftover value from wherever the
  // visitor navigated from (client-side routing keeps <body> itself mounted)
  // would otherwise persist and shove the centred card down the page.
  useEffect(() => {
    if (standalone) {
      document.body.style.paddingTop = "";
    }
  }, [standalone]);

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <HoneycombNav variant="mobile" />
    </>
  );
}
