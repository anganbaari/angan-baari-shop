import type { Metadata } from "next";
import "./globals.css";
import "@/styles/site.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HoneycombNav from "@/components/HoneycombNav";

export const metadata: Metadata = {
  title: "आँगन बारी | Angan Baari",
  description:
    "Browse fresh organic products from Angan Baari — honey, fruits, vegetables, animals and pickles from our farm in Bhulka Danda, Rupandehi, Nepal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Same fonts, same weights, same loading method as the real site
            (reference/shop.html <head>) — a plain link tag rather than
            next/font, since src/styles/site.css references these family
            names as literal strings, not next/font-generated variables. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&family=Cinzel:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {/* Font Awesome CDN — matches the real site's <head> exactly (used by
            the footer's social icons). */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <HoneycombNav variant="mobile" />
      </body>
    </html>
  );
}
