import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kigali Home Hub",
  description: "A smart rental marketplace for matching, booking, and managing homes in Kigali."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
