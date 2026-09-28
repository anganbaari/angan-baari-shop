"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupRequest, ApiValidationError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

/** Ported verbatim from signup.html's scorePassword() — four leaves fill in
 * as length/character variety grows. This is a client-side hint only; the
 * API's own validate_password() (Django's real, stricter validators) is
 * still the source of truth and runs server-side regardless. */
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

/**
 * Ported from reference/signup.html. Same two omissions as LoginView (the
 * .side-top brand/flag block and the .side-nav-float links — the shared
 * Header already covers both), for the same reason. The "Continue with
 * Google/Facebook" buttons are ported as-is, including being inert: the
 * reference's own href="#" has no click handler behind it either — there's
 * no OAuth backend, here or there, so this isn't a gap introduced by the
 * port.
 */
export default function SignupView() {
  const router = useRouter();
  const { login: storeLogin } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const score = useMemo(() => scorePassword(password), [password]);
  const matchState: "none" | "ok" | "no" = !confirmPassword ? "none" : confirmPassword === password ? "ok" : "no";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setErrors([]);
    setSubmitting(true);
    try {
      const result = await signupRequest({
        name,
        email,
        password,
        confirm_password: confirmPassword,
      });
      storeLogin(result.token, result.user);
      router.push("/");
    } catch (err) {
      setErrors(err instanceof ApiValidationError ? err.messages : ["Something went wrong. Please try again."]);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="side-top">
          <h1 className="side-headline">
            Grow your <em>own</em>
            <br />
            place at the table.
          </h1>
          <div className="side-highlight">
            <i className="fas fa-fire" />
            <p>
              Create an account to unlock member pricing on seasonal fruit, honey, and festival offers —
              straight from Bhulka Danda to your door.
            </p>
          </div>
        </div>

        <div className="side-social-label">Quick sign up</div>
        <div className="social-buttons">
          <a href="#" className="social-btn social-google" onClick={(e) => e.preventDefault()}>
            <i className="fab fa-google" /> Continue with Google
          </a>
          <a href="#" className="social-btn social-facebook" onClick={(e) => e.preventDefault()}>
            <i className="fab fa-facebook-f" /> Continue with Facebook
          </a>
        </div>

        <div className="glass-strip">
          <div className="glass-card">
            <i className="fas fa-apple-whole" />
            <b>Fresh, seasonal picks</b>
            <p>Mango, lychee, papaya &amp; more, harvested to order.</p>
          </div>
          <div className="glass-card">
            <i className="fas fa-jar" />
            <b>Raw farm honey</b>
            <p>From our own hives, five colonies strong.</p>
          </div>
          <div className="glass-card">
            <i className="fas fa-tag" />
            <b>Member-only offers</b>
            <p>Festival discounts unlocked once you&apos;re signed in.</p>
          </div>
        </div>
        <div className="side-foot">Bhulka Danda, Tilottama, Rupandehi, Nepal 🇳🇵</div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-eyebrow">New here</div>
          <h2 className="auth-title">Create your account</h2>

          {errors.length > 0 && (
            <div className="messages">
              {errors.map((msg, i) => (
                <div className="msg msg-error" key={i}>
                  <i className="fas fa-circle-exclamation" /> {msg}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="id_name">Full Name</label>
              <div className="input-wrap">
                <i className="fas fa-user field-icon" />
                <input
                  type="text"
                  id="id_name"
                  name="name"
                  placeholder="Ramesh Thapa"
                  required
                  autoFocus
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="id_email">Email Address</label>
              <div className="input-wrap">
                <i className="fas fa-envelope field-icon" />
                <input
                  type="email"
                  id="id_email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="id_password">Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="id_password"
                  name="password"
                  className="pw-input"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
                </button>
              </div>
              <div className="strength-row">
                <div className="strength-leaves" id="strengthLeaves">
                  {[0, 1, 2, 3].map((i) => (
                    <i
                      key={i}
                      className={`fas fa-leaf${i < score ? " on" : ""}${score === 4 ? " strong" : ""}`}
                    />
                  ))}
                </div>
                <span className="strength-label">{password ? STRENGTH_LABELS[score] : ""}</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="id_confirm_password">Confirm Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock field-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="id_confirm_password"
                  name="confirm_password"
                  className="pw-input"
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirmPassword((s) => !s)}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"} />
                </button>
              </div>
              <div className={`match-hint${matchState !== "none" ? " show" : ""}${matchState === "ok" ? " ok" : ""}${matchState === "no" ? " no" : ""}`}>
                <i className={matchState === "ok" ? "fas fa-check" : "fas fa-xmark"} />{" "}
                <span>{matchState === "ok" ? "Passwords match" : matchState === "no" ? "Passwords don't match" : ""}</span>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={submitting}>
              <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-user-plus"} />{" "}
              {submitting ? "Creating Account…" : "Create Account"}
            </button>
          </form>

          <div className="auth-links">
            Already have an account? <Link href="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
