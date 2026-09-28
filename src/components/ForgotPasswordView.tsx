"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/api";

/**
 * Ported from reference/forgot_password.html — a much simpler standalone
 * card than login/signup, so it keeps its own inline "seedling" logo
 * rather than needing anything from the shared shell removed.
 *
 * Always shows the same success message regardless of what the API
 * actually returned (the API itself already returns an identical response
 * either way — see api/views.py's PasswordResetRequestView — so this isn't
 * adding new anti-enumeration behavior, just not discarding it).
 */
export default function ForgotPasswordView() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset({ email });
    } catch {
      // Network/server failure, not "email not found" (the API never
      // reports that distinction) — the only case worth a different message.
      setError("Could not send the reset link right now. Please try again.");
      setSubmitting(false);
      return;
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="fas fa-seedling" />
          <h1>आँगन बारी</h1>
          <p>Angan Baari · Organic Farm</p>
        </div>

        <h2 className="auth-title">Forgot Password? 🔑</h2>
        <p className="auth-subtitle">Enter your email and we&apos;ll send you a link to reset your password.</p>

        {(sent || error) && (
          <div className="messages">
            {sent && <div className="msg msg-success">If an account exists with that email, a reset link has been sent.</div>}
            {error && <div className="msg msg-error">{error}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-auth" disabled={submitting}>
            <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-paper-plane"} />{" "}
            {submitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-links">
          <Link href="/login">
            <i className="fas fa-arrow-left" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
