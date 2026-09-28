"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { confirmPasswordReset, ApiValidationError } from "@/lib/api";

/** Ported from reference/reset_password.html. Token comes from the route
 * param (the reference reads it from the URL path the same way and carries
 * it as a hidden form field — here it's just held in state and sent
 * directly in the request body instead). */
export default function ResetPasswordView({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setErrors([]);
    setTokenInvalid(false);
    setSubmitting(true);
    try {
      await confirmPasswordReset({ token, password, confirm_password: confirmPassword });
      router.push("/login?reset=success");
    } catch (err) {
      if (err instanceof ApiValidationError) {
        setErrors(err.messages);
        // "token: This reset link is invalid or has expired." — surfaced by
        // the field name the API actually uses (see
        // PasswordResetConfirmSerializer.validate() in api/serializers.py).
        setTokenInvalid(err.messages.some((m) => m.startsWith("token:")));
      } else {
        setErrors(["Something went wrong. Please try again."]);
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <i className="fas fa-seedling" />
          <h1>आँगन बारी</h1>
          <p>Angan Baari · Organic Farm</p>
        </div>

        <h2 className="auth-title">Set New Password 🔐</h2>

        {errors.length > 0 && (
          <div className="messages">
            {errors.map((msg, i) => (
              <div className="msg msg-error" key={i}>
                {msg}
              </div>
            ))}
          </div>
        )}

        {tokenInvalid ? (
          <div className="auth-links">
            <Link href="/forgot-password">
              <i className="fas fa-arrow-left" /> Request a new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min. 8 characters"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                placeholder="Repeat new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-auth" disabled={submitting}>
              <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-check"} />{" "}
              {submitting ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
