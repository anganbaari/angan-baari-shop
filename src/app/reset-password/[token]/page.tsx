import "@/styles/reset-password.css";
import type { Metadata } from "next";
import ResetPasswordView from "@/components/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset Password | Angan Baari",
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetPasswordView token={token} />;
}
