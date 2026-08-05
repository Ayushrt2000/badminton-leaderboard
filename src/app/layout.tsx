import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--inter-font",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--bebas-font",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smash Rank | Badminton Social Leaderboard",
  description:
    "Sign up, log matches, and watch the leaderboard update live at your badminton socials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable} dark`}>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
