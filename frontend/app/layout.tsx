import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/styles/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeterMint Dashboard",
  description: "Modern high-performance developer billing and API instrumentation platform",
};

import { TenantProvider } from "@/lib/tenant-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="flat" className={`${outfit.variable}`}>
      <body className="antialiased font-sans">
        <TenantProvider>
          <div id="theme-container" className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {children}
          </div>
        </TenantProvider>
      </body>
    </html>
  );
}
