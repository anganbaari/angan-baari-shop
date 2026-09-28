import "@/styles/forgot-password.css";
import type { Metadata } from "next";
import ForgotPasswordView from "@/components/ForgotPasswordView";

export const metadata: Metadata = {
  title: "Forgot Password | Angan Baari",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
