"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { ApiValidationError } from "@/lib/api";
import {
  ApiSessionError,
  cancelOrder,
  changePassword,
  fetchLiveCoupons,
  fetchMyOrders,
  fetchWishlist,
  reorderOrder,
  updateProfile,
  wishlistMoveToCart,
  wishlistSetVariant,
  wishlistToggle,
  type Coupon,
  type OrderHistoryItem,
  type WishlistItem,
} from "@/lib/profile";

/**
 * Ported from reference/profile.html's `.profile-page` content only — the
 * navbar/footer/mobile-nav markup it duplicates inline (a standalone-document
 * habit shared by every other traditional-site page) is left out here, same
 * as every other non-auth page in this app: the shared Header/Footer/
 * HoneycombNav from layout.tsx already provides all three, and Header.tsx
 * already sets body's padding-top to the measured navbar height (see the
 * comment on .profile-page in profile.css for why the reference's own 100px
 * top padding — and its page-local syncProfileTopSpacing() script — are both
 * dropped here rather than ported).
 *
 * Known gap vs. the reference: "Member since {{ user.date_joined }}" isn't
 * rendered — no endpoint in this API exposes date_joined (AuthUser is just
 * {id, name, email}), so there's nothing to show. Same category of gap as
 * ProductDetailView's documented ones (missing from the API, not a design
 * choice).
 */
export default function ProfileView() {
  const router = useRouter();
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login?next=/profile");
  }, [isLoggedIn, router]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  /** A 401 from any of these calls means the token itself is no longer
   * valid — send the visitor back to /login rather than show a confusing
   * error inline, same as if they'd never been logged in. */
  function handleSessionExpiry(err: unknown): boolean {
    if (err instanceof ApiSessionError) {
      logout();
      router.replace("/login?next=/profile");
      return true;
    }
    return false;
  }

  if (!isLoggedIn || !user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-id">
          <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p>
              <i className="fas fa-envelope" /> {user.email}
            </p>
          </div>
        </div>
        <div className="profile-actions">
          <button
            type="button"
            className="btn-logout"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>

      <AccountSettings
        user={user}
        updateUser={updateUser}
        onSessionExpired={handleSessionExpiry}
        showToast={showToast}
      />

      <WishlistSection
        addItem={addItem}
        onSessionExpired={handleSessionExpiry}
        showToast={showToast}
      />

      <CouponsSection onSessionExpired={handleSessionExpiry} />

      <OrdersSection
        addItem={addItem}
        onSessionExpired={handleSessionExpiry}
        showToast={showToast}
      />

      <div id="profileToast" className={toast ? "show" : undefined}>
        <i className="fas fa-check-circle" /> <span>{toast}</span>
      </div>
    </div>
  );
}

// ─── Account settings ───────────────────────────────────────────

function AccountSettings({
  user,
  updateUser,
  onSessionExpired,
  showToast,
}: {
  user: { id: number; name: string; email: string };
  updateUser: (user: { id: number; name: string; email: string }) => void;
  onSessionExpired: (err: unknown) => boolean;
  showToast: (text: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileErrors, setProfileErrors] = useState<string[]>([]);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (profileSubmitting) return;
    setProfileErrors([]);
    setProfileSubmitting(true);
    try {
      const updated = await updateProfile({ name, email });
      updateUser(updated);
      showToast("Profile updated successfully.");
    } catch (err) {
      if (onSessionExpired(err)) return;
      setProfileErrors(err instanceof ApiValidationError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setProfileSubmitting(false);
    }
  }

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew1, setShowNew1] = useState(false);
  const [showNew2, setShowNew2] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (passwordSubmitting) return;
    setPasswordErrors([]);
    setPasswordSubmitting(true);
    try {
      await changePassword({ old_password: oldPassword, new_password1: newPassword1, new_password2: newPassword2 });
      setOldPassword("");
      setNewPassword1("");
      setNewPassword2("");
      showToast("Password changed successfully.");
    } catch (err) {
      if (onSessionExpired(err)) return;
      setPasswordErrors(err instanceof ApiValidationError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <div className="settings-grid">
      <details className="settings-card">
        <summary>
          <i className="fas fa-user-edit" /> Edit Profile <i className="fas fa-chevron-down chevron" />
        </summary>
        <form onSubmit={handleProfileSubmit} className="settings-form">
          {profileErrors.map((msg, i) => (
            <div className="settings-msg settings-msg-error" key={i}>
              {msg}
            </div>
          ))}
          <div>
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="settings-submit" disabled={profileSubmitting}>
            <i className={profileSubmitting ? "fas fa-spinner fa-spin" : "fas fa-check"} />{" "}
            {profileSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </details>

      <details className="settings-card">
        <summary>
          <i className="fas fa-lock" /> Change Password <i className="fas fa-chevron-down chevron" />
        </summary>
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          {passwordErrors.map((msg, i) => (
            <div className="settings-msg settings-msg-error" key={i}>
              {msg}
            </div>
          ))}
          <div>
            <label>Current Password</label>
            <div className="pw-input-wrap">
              <input
                type={showOld ? "text" : "password"}
                className="pw-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="settings-pw-toggle"
                aria-label={showOld ? "Hide password" : "Show password"}
                onClick={() => setShowOld((s) => !s)}
              >
                <i className={showOld ? "fas fa-eye-slash" : "fas fa-eye"} />
              </button>
            </div>
          </div>
          <div>
            <label>New Password</label>
            <div className="pw-input-wrap">
              <input
                type={showNew1 ? "text" : "password"}
                className="pw-input"
                value={newPassword1}
                onChange={(e) => setNewPassword1(e.target.value)}
                required
              />
              <button
                type="button"
                className="settings-pw-toggle"
                aria-label={showNew1 ? "Hide password" : "Show password"}
                onClick={() => setShowNew1((s) => !s)}
              >
                <i className={showNew1 ? "fas fa-eye-slash" : "fas fa-eye"} />
              </button>
            </div>
          </div>
          <div>
            <label>Confirm New Password</label>
            <div className="pw-input-wrap">
              <input
                type={showNew2 ? "text" : "password"}
                className="pw-input"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                required
              />
              <button
                type="button"
                className="settings-pw-toggle"
                aria-label={showNew2 ? "Hide password" : "Show password"}
                onClick={() => setShowNew2((s) => !s)}
              >
                <i className={showNew2 ? "fas fa-eye-slash" : "fas fa-eye"} />
              </button>
            </div>
          </div>
          <button type="submit" className="settings-submit" disabled={passwordSubmitting}>
            <i className={passwordSubmitting ? "fas fa-spinner fa-spin" : "fas fa-key"} />{" "}
            {passwordSubmitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </details>
    </div>
  );
}

// ─── Wishlist ─────────────────────────────────────────────────

function WishlistSection({
  addItem,
  onSessionExpired,
  showToast,
}: {
  addItem: ReturnType<typeof useCart>["addItem"];
  onSessionExpired: (err: unknown) => boolean;
  showToast: (text: string) => void;
}) {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchWishlist()
      .then(setItems)
      .catch((err) => {
        if (!onSessionExpired(err)) setItems([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBusy(productId: number, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  async function handleVariantChange(item: WishlistItem, variantId: number) {
    try {
      await wishlistSetVariant(item.product.id, variantId);
      setItems((prev) =>
        prev
          ? prev.map((i) =>
              i.id === item.id
                ? { ...i, variant: i.product.variants.find((v) => v.id === variantId) ?? i.variant }
                : i,
            )
          : prev,
      );
    } catch (err) {
      if (!onSessionExpired(err)) showToast("Could not update the selected size right now — please try again.");
    }
  }

  async function handleRemove(item: WishlistItem) {
    setBusy(item.product.id, true);
    try {
      await wishlistToggle(item.product.id);
      setItems((prev) => (prev ? prev.filter((i) => i.id !== item.id) : prev));
    } catch (err) {
      if (!onSessionExpired(err)) showToast("Could not remove this item right now — please try again.");
    } finally {
      setBusy(item.product.id, false);
    }
  }

  async function handleMoveToCart(item: WishlistItem) {
    setBusy(item.product.id, true);
    try {
      const result = await wishlistMoveToCart(item.product.id, item.variant?.id);
      addItem(result.product, { variant: result.variant });
      setItems((prev) => (prev ? prev.filter((i) => i.id !== item.id) : prev));
      showToast(`${result.product.name} added to cart`);
    } catch (err) {
      if (!onSessionExpired(err)) showToast("Could not add this item to your cart right now — please try again.");
    } finally {
      setBusy(item.product.id, false);
    }
  }

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">My Wishlist</h2>
        <span className="orders-count-badge">{items?.length ?? 0}</span>
      </div>
      {items === null ? (
        <div className="profile-section-loading">Loading your wishlist…</div>
      ) : items.length === 0 ? (
        <div className="no-wishlist">
          <i className="far fa-heart" style={{ fontSize: "1.6rem", display: "block", marginBottom: 8, color: "var(--sage-light)" }} />
          Nothing saved yet — tap the heart icon on any product to save it here.
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const product = item.product;
            const busy = busyIds.has(product.id);
            const availableVariants = product.variants;

            return (
              <div className="wishlist-card" key={item.id}>
                <Link href={`/product/${product.slug}`} className="wishlist-card-img">
                  {product.main_image ? (
                    <Image src={product.main_image} alt={product.name} width={170} height={120} style={{ objectFit: "cover" }} />
                  ) : (
                    <i className="fas fa-seedling" style={{ fontSize: "1.6rem", color: "var(--moss)" }} />
                  )}
                </Link>
                <div className="wishlist-card-body">
                  <Link href={`/product/${product.slug}`} className="wishlist-card-name" style={{ display: "block", textDecoration: "none" }}>
                    {product.name}
                  </Link>

                  {product.pricing_mode === "fixed_weight" && availableVariants.length > 1 ? (
                    <>
                      <select
                        className="wishlist-variant-select"
                        value={item.variant?.id ?? availableVariants[0]?.id}
                        onChange={(e) => handleVariantChange(item, Number(e.target.value))}
                      >
                        {availableVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {Number(v.weight).toFixed(2)} kg — Rs. {Math.round(Number(v.total_price))}
                          </option>
                        ))}
                      </select>
                      <div className="wishlist-card-price">
                        Rs. {Math.round(Number(item.variant?.total_price ?? product.locked_total_price ?? 0))}{" "}
                        <span style={{ color: "var(--text-muted)" }}>fixed price</span>
                      </div>
                    </>
                  ) : product.pricing_mode === "fixed_weight" ? (
                    <div className="wishlist-card-price">
                      Rs. {Math.round(Number(item.variant?.total_price ?? product.locked_total_price ?? 0))}{" "}
                      <span style={{ color: "var(--text-muted)" }}>fixed price</span>
                    </div>
                  ) : (
                    <div className="wishlist-card-price">
                      Rs. {product.price} <span style={{ color: "var(--text-muted)" }}>{product.price_unit}</span>
                    </div>
                  )}

                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="wishlist-btn wishlist-btn-cart"
                      disabled={busy}
                      onClick={() => handleMoveToCart(item)}
                    >
                      <i className="fas fa-cart-plus" /> <span>Add to Cart</span>
                    </button>
                    <button
                      type="button"
                      className="wishlist-btn wishlist-btn-remove"
                      disabled={busy}
                      onClick={() => handleRemove(item)}
                    >
                      <i className="fas fa-heart-broken" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ─── Coupons ──────────────────────────────────────────────────

function CouponsSection({ onSessionExpired }: { onSessionExpired: (err: unknown) => boolean }) {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveCoupons()
      .then(setCoupons)
      .catch((err) => {
        if (!onSessionExpired(err)) setCoupons([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1600);
    });
  }

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">My Coupons</h2>
        <span className="orders-count-badge">{coupons?.length ?? 0}</span>
      </div>
      {coupons === null ? (
        <div className="profile-section-loading">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className="no-coupons">
          <i className="fas fa-tag" style={{ fontSize: "1.6rem", display: "block", marginBottom: 8, color: "var(--sage-light)" }} />
          No active coupons right now — check back during festival season!
        </div>
      ) : (
        <div className="coupons-grid">
          {coupons.map((coupon) => (
            <div className="coupon-card" key={coupon.id}>
              {coupon.festival_name && <div className="coupon-festival">{coupon.festival_name}</div>}
              <div className="coupon-code">{coupon.code}</div>
              <div className="coupon-desc">
                {coupon.discount_type === "percent"
                  ? `${Math.round(Number(coupon.discount_value))}% off`
                  : `Rs. ${Math.round(Number(coupon.discount_value))} off`}
                {coupon.description ? ` — ${coupon.description}` : ""}
              </div>
              <button type="button" className="coupon-copy-btn" onClick={() => handleCopy(coupon.code)}>
                <i className={copiedCode === coupon.code ? "fas fa-check" : "fas fa-copy"} />{" "}
                {copiedCode === coupon.code ? "Copied!" : "Copy Code"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Order history ────────────────────────────────────────────

function timelineStepClass(status: OrderHistoryItem["status"], step: "pending" | "confirmed" | "delivered"): string {
  const order = ["pending", "confirmed", "delivered"];
  const statusIndex = order.indexOf(status);
  const stepIndex = order.indexOf(step);
  if (statusIndex > stepIndex) return "done";
  if (statusIndex === stepIndex) return "current";
  return "";
}

function OrdersSection({
  addItem,
  onSessionExpired,
  showToast,
}: {
  addItem: ReturnType<typeof useCart>["addItem"];
  onSessionExpired: (err: unknown) => boolean;
  showToast: (text: string) => void;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistoryItem[] | null>(null);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((err) => {
        if (!onSessionExpired(err)) setOrders([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBusy(id: number, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleCancel(order: OrderHistoryItem) {
    if (!window.confirm(`Cancel order ${order.order_number}? This action cannot be undone.`)) return;
    setBusy(order.id, true);
    try {
      const updated = await cancelOrder(order.id);
      setOrders((prev) => (prev ? prev.map((o) => (o.id === order.id ? updated : o)) : prev));
      showToast("Order cancelled successfully.");
    } catch (err) {
      if (!onSessionExpired(err)) showToast(err instanceof Error ? err.message : "Could not cancel this order right now.");
    } finally {
      setBusy(order.id, false);
    }
  }

  async function handleReorder(order: OrderHistoryItem) {
    setBusy(order.id, true);
    try {
      const result = await reorderOrder(order.id);
      for (const item of result.items) {
        addItem(item.product, { weight: item.weight, qty: item.qty });
      }
      if (result.items.length === 0) {
        showToast(result.message || "None of the items from this order are available to reorder right now.");
        return;
      }
      if (result.skipped_count > 0) {
        showToast(`${result.items.length} item(s) added — ${result.skipped_count} no longer available.`);
      }
      router.push("/cart");
    } catch (err) {
      if (!onSessionExpired(err)) showToast(err instanceof Error ? err.message : "Could not reorder right now.");
    } finally {
      setBusy(order.id, false);
    }
  }

  return (
    <>
      <div className="section-head">
        <h2 className="section-title">My Orders</h2>
        <span className="orders-count-badge">{orders?.length ?? 0}</span>
      </div>

      {orders === null ? (
        <div className="profile-loading">Loading your orders…</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <i className="fas fa-shopping-bag" />
          <p>No orders yet — your first basket from the farm is just a tap away.</p>
          <Link href="/" className="btn-shop">
            <i className="fas fa-leaf" /> Start Shopping
          </Link>
        </div>
      ) : (
        orders.map((order) => {
          const busy = busyIds.has(order.id);
          return (
            <div className={`order-card status-${order.status}`} key={order.id}>
              <div className="order-top">
                <span className="order-num">{order.order_number}</span>
                <span className="order-date">
                  {new Date(order.ordered_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className={`order-status status-${order.status}`}>{order.status_display}</span>
              </div>
              <div className="order-product">
                <i className="fas fa-box" style={{ color: "var(--moss)", marginRight: 6 }} />
                {order.product_interest}
              </div>
              <div className="order-address">
                <i className="fas fa-map-marker-alt" style={{ marginRight: 6 }} />
                {order.address}
              </div>

              {order.status === "cancelled" ? (
                <div className="order-timeline cancelled-timeline">
                  <span className="cancelled-note">
                    <i className="fas fa-circle-xmark" /> This order was cancelled
                  </span>
                </div>
              ) : (
                <div className="order-timeline">
                  <div className="timeline-step done">
                    <div className="timeline-dot">
                      <i className="fas fa-check" />
                    </div>
                    <div className="timeline-label">Placed</div>
                  </div>
                  {(["pending", "confirmed", "delivered"] as const).map((step, i) => {
                    const stepClass = timelineStepClass(order.status, step);
                    const labels = ["Pending", "Confirmed", "Delivered"];
                    return (
                      <div className={`timeline-step ${stepClass}`} key={step}>
                        <div className="timeline-dot">
                          {stepClass === "done" ? <i className="fas fa-check" /> : <i className="fas fa-clock" />}
                        </div>
                        <div className="timeline-label">{labels[i]}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {order.can_cancel && (
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="cancel-order-link" disabled={busy} onClick={() => handleCancel(order)}>
                    Cancel Order
                  </button>
                </div>
              )}

              {order.has_cart_snapshot && (
                <div style={{ marginTop: 10 }}>
                  <button type="button" className="reorder-btn" disabled={busy} onClick={() => handleReorder(order)}>
                    <i className="fas fa-rotate" /> Reorder
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}
