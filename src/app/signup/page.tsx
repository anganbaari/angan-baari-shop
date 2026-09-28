import "@/styles/signup.css";
import type { Metadata } from "next";
import SignupView from "@/components/SignupView";

export const metadata: Metadata = {
  title: "Sign Up | Angan Baari",
};

export default function SignupPage() {
  return <SignupView />;
}
