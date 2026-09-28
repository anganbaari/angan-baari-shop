"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginRequest, ApiValidationError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Greeting = { text: string; icon: string };

/** Ported verbatim from login.html's time-of-day greeting IIFE. Read via
 * useSyncExternalStore (a no-op subscribe; the value is only read once,
 * on mount) rather than useEffect+setState: the greeting depends on the
 * visitor's local clock, which the server can't know, so it must never be
 * computed during SSR — this is the same pattern used for the client-only
 * sessionStorage read on the order-confirmation page, and it avoids a
 * synchronous setState-in-effect without introducing a real hydration
 * mismatch (the server snapshot below is a neutral placeholder, not a
 * guess at the visitor's actual time of day).
 *
 * Memoized after the first call: useSyncExternalStore requires getSnapshot
 * to return a stable reference between renders unless the store actually
 * changed (which subscribeNoop never signals), and the greeting is meant
 * to be fixed at mount anyway — same as the original, which never
 * re-evaluated it either. */
let cachedGreeting: Greeting | null = null;
function computeGreeting(): Greeting {
  if (cachedGreeting) return cachedGreeting;
  const hour = new Date().getHours();
  if (hour < 5) cachedGreeting = { text: "Working late?", icon: "fa-moon" };
  else if (hour < 12) cachedGreeting = { text: "Good morning", icon: "fa-sun" };
  else if (hour < 17) cachedGreeting = { text: "Good afternoon", icon: "fa-sun" };
  else if (hour < 21) cachedGreeting = { text: "Good evening", icon: "fa-cloud-moon" };
  else cachedGreeting = { text: "Working late?", icon: "fa-moon" };
  return cachedGreeting;
}
const subscribeNoop = () => () => {};
const SERVER_GREETING: Greeting = { text: "", icon: "fa-sun" };
const getServerGreeting = (): Greeting => SERVER_GREETING;

/**
 * Ported from reference/login.html's .auth-shell layout. Two deliberate
 * omissions from the reference, both because this app already has a
 * persistent shared Header above every page (login.html has none — it's a
 * standalone document with its own brand block and Nepal flag canvas):
 * - The .side-top brand block (logo/name/flag canvas) — the shared Header
 *   already shows this on every route; repeating it here would duplicate
 *   the brand and put a second #navNepalFlag canvas in the same document.
 * - The two .side-nav-float "Back to Shop"/"Back to Website" links — the
 *   shared Header + HoneycombNav already provide that navigation.
 * Everything else (greeting, headline, highlight banner, stats strip,
 * footer line, the whole form) is real, matching the reference markup.
 */
export default function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: storeLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const greeting = useSyncExternalStore(subscribeNoop, computeGreeting, getServerGreeting);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setErrors([]);
    setSubmitting(true);
    try {
      const result = await loginRequest({ email, password });
      storeLogin(result.token, result.user);
      // "Remember me" has no session-expiry equivalent for a token (tokens
      // don't expire on their own) — the reference's version only ever
      // affected Django's session cookie lifetime, so there's nothing to
      // carry over here beyond accepting the checkbox visually.
      void rememberMe;
      const next = searchParams.get("next");
      router.push(next || "/");
    } catch (err) {
      setErrors(err instanceof ApiValidationError ? err.messages : ["Something went wrong. Please try again."]);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="side-top">
          <div className="side-greeting">
            <i className={`fas ${greeting.icon}`} /> <span>{greeting.text}</span>
          </div>
          <h1 className="side-headline">
            Welcome back to
            <br />
            the <em>farm</em>.
          </h1>
          <div className="side-highlight">
            <i className="fas fa-fire" />
            <p>Sign in for member pricing, festival offers, and to pick up right where your cart left off.</p>
          </div>
        </div>
        <div className="glass-strip">
          <div className="glass-card side-stat">
            <b>5</b>
            <span>Beehive colonies</span>
          </div>
          <div className="glass-card side-stat">
            <b>6+</b>
            <span>Fruit varieties</span>
          </div>
          <div className="glass-card side-stat">
            <b>100%</b>
            <span>Organic, home-grown</span>
          </div>
        </div>
        <div className="side-foot">Bhulka Danda, Tilottama, Rupandehi, Nepal 🇳🇵</div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-eyebrow">Member login</div>
          <h2 className="auth-title">Welcome back</h2>

          {(errors.length > 0 || searchParams.get("reset") === "success") && (
            <div className="messages">
              {searchParams.get("reset") === "success" && (
                <div className="msg msg-success">
                  <i className="fas fa-circle-exclamation" /> Password reset successfully! Please log in.
                </div>
              )}
              {errors.map((msg, i) => (
                <div className="msg msg-error" key={i}>
                  <i className="fas fa-circle-exclamation" /> {msg}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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
                  autoFocus
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
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
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
            </div>

            <div className="field-row">
              <label className="remember-me">
                <input type="checkbox" name="remember_me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-auth" disabled={submitting}>
              <i className={submitting ? "fas fa-spinner fa-spin" : "fas fa-sign-in-alt"} /> {submitting ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="auth-links">
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
