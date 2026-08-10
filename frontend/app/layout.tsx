import type { Metadata } from "next";
import { AppToaster } from "./components/theme/AppToaster";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { availableThemeNames } from "./components/theme/theme-options";
import { QueryProvider } from "./lib/query/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidNaija — Verified auctions for cars and gadgets",
  description:
    "Buy and sell verified cars and gadgets through transparent online auctions across Nigeria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          themes={[...availableThemeNames]}
        >
          <QueryProvider>
            {children}
            <AppToaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
