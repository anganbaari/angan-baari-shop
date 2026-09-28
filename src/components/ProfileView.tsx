"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * A stub — no reference/profile.html exists to port yet (out of scope for
 * this phase, per the task). Exists so /profile is a real destination for
 * the honeycomb nav's Profile cell, and — since the reference nav itself
 * has no logout affordance at all (logout lives on the traditional site's
 * own profile page) — so there's somewhere to actually log out from.
 */
export default function ProfileView() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login?next=/profile");
  }, [isLoggedIn, router]);

  if (!isLoggedIn || !user) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-forest">{user.name || user.email}</h1>
      <p className="mt-2 text-text-muted">{user.email}</p>
      <p className="mt-6 max-w-sm text-sm text-text-muted">
        Order history and account details are coming in a later phase — for now, this page just confirms
        you&apos;re signed in.
      </p>
      <button
        type="button"
        onClick={async () => {
          await logout();
          router.push("/");
        }}
        className="mt-6 rounded-full bg-forest px-6 py-3 font-medium text-cream transition hover:bg-moss"
      >
        Log out
      </button>
    </div>
  );
}
