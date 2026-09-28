"use client";

import "@/styles/success.css";
import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { CONFIRMATION_KEY } from "@/components/CheckoutView";

interface Confirmation {
  orderNumber: string;
  name: string;
  email: string;
  address: string;
  items: { name: string; qty: number; weight: string | null }[];
  total: number;
}

/**
 * Uses reference/success.html's real .success-card markup and styles, with
 * the data the API actually hands back (order_number) plus the details we
 * submitted. The reference page is standalone (no navbar/footer) and
 * centres itself via a body flex rule; here it renders inside the shared
 * shell, so the centring lives on .success-wrap instead (see success.css).
 */
/** sessionStorage read via useSyncExternalStore rather than a mount effect:
 * it isn't available during SSR, and the snapshot here is a plain string, so
 * React's identity check is stable and hydration stays clean (server renders
 * the null snapshot, the real one takes over once hydrated). The value is
 * written once by checkout and never changes while this page is open, so
 * subscribe is a no-op. */
const subscribeNoop = () => () => {};
const getStoredOrder = () => {
  try {
    return window.sessionStorage.getItem(CONFIRMATION_KEY);
  } catch {
    return null;
  }
};
const getServerOrder = () => null;

export default function OrderConfirmationPage() {
  const raw = useSyncExternalStore(subscribeNoop, getStoredOrder, getServerOrder);

  const order = useMemo<Confirmation | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Confirmation;
    } catch {
      return null;
    }
  }, [raw]);

  if (!order) {
    return (
      <div className="success-wrap">
        <div className="success-card">
          <h1 className="success-title">No recent order</h1>
          <p className="success-subtitle">
            We don&apos;t have an order to show here. If you just placed one, check your email for the
            confirmation.
          </p>
          <div className="btn-row">
            <Link href="/" className="btn-shop">
              <i className="fas fa-store" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const productSummary = order.items
    .map((i) => (i.weight ? `${i.name} (${i.weight}kg) x${i.qty}` : `${i.name} x${i.qty}`))
    .join(", ");

  return (
    <div className="success-wrap">
      <div className="success-card">
        <div className="success-icon">
          <i className="fas fa-check" />
        </div>

        <h1 className="success-title">Order Received!</h1>
        <p className="success-subtitle">
          नमस्ते <strong>{order.name}</strong>! 🌿
          <br />
          Thank you for ordering from Angan Baari.
        </p>

        <div className="order-box">
          <p className="order-box-title">📦 Order Details</p>

          <div className="order-row">
            <span className="order-label">Order No</span>
            <span className="order-value order-number-value">{order.orderNumber}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Product</span>
            <span className="order-value">{productSummary}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Address</span>
            <span className="order-value">{order.address}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Total</span>
            <span className="order-value">Rs. {order.total.toFixed(2)}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Status</span>
            <span className="order-value">
              <span className="status-badge">
                <i className="fas fa-clock" /> Pending Confirmation
              </span>
            </span>
          </div>
        </div>

        <p className="info-text">
          A confirmation email has been sent to <strong>{order.email}</strong>.
          <br />
          We will confirm your order shortly. Expected delivery: <strong>2–3.5 hours</strong> after
          confirmation.
        </p>

        <a
          href={`https://wa.me/9779821025084?text=${encodeURIComponent(
            `Hello Angan Baari! I just placed an order ${order.orderNumber} and want to confirm.`,
          )}`}
          className="btn-whatsapp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fab fa-whatsapp" /> Confirm via WhatsApp
        </a>

        <div className="btn-row">
          <Link href="/" className="btn-shop">
            <i className="fas fa-store" /> Continue Shopping
          </Link>
          <a href="https://anganbaari.pythonanywhere.com/" className="btn-home">
            <i className="fas fa-home" /> Website
          </a>
        </div>
      </div>
    </div>
  );
}
