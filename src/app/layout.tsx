import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { JobsProvider } from "../context/JobsContext";
import { QuoteProvider } from "../context/QuoteContext";

export const metadata: Metadata = {
  title: "RoadHero | Technician Portal",
  description: "RoadHero Technician mobile portal — manage jobs, update statuses, and create service quotes.",
  applicationName: "RoadHero Tech",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RoadHero Tech",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f1e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning />
      <body suppressHydrationWarning>
        <AuthProvider>
          <JobsProvider>
            <QuoteProvider>
              {children}
            </QuoteProvider>
          </JobsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
