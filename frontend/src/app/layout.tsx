// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageProvider";
import LayoutWrapper from "@/components/LayoutWrapper"; // ✅ IMPORT THE WRAPPER
import "./globals.css";

export const metadata: Metadata = {
  title: "Adinas General Hospital - Excellence in Healthcare Services",
  description:
    "Comprehensive healthcare services including hospital care, diagnostics, pharmacy, and specialized medical treatments",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/Adinas-Icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1f2e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <ThemeProvider>
          <LanguageProvider>
            
            {/* ✅ USE THE WRAPPER COMPONENT HERE */}
            <LayoutWrapper>
              {children}
            </LayoutWrapper>

          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}