import "@/styles/login.css";
import { Suspense } from "react";
import type { Metadata } from "next";
import LoginView from "@/components/LoginView";

export const metadata: Metadata = {
  title: "Login | Angan Baari",
};

export default function LoginPage() {
  return (
    // Suspense boundary is required by Next.js around anything using
    // useSearchParams() (LoginView reads ?next= to redirect back after
    // login) — without it, static generation of this route fails.
    <Suspense fallback={<div className="auth-shell" />}>
      <LoginView />
    </Suspense>
  );
}
