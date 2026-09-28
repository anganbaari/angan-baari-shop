import "@/styles/profile.css";
import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";

export const metadata: Metadata = {
  title: "Your Account | Angan Baari",
};

export default function ProfilePage() {
  return <ProfileView />;
}
