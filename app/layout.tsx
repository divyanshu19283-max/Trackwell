import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trakwell — Repair & Service Ticket Management",
  description:
    "Trakwell helps repair and service businesses manage customers, tickets, and repair status — with a live tracking page customers can check without an account.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Trakwell — Repair & Service Ticket Management",
    description: "Track every repair from intake to delivery. Simple, fast, and built for service teams.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
