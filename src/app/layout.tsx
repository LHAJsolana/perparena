import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { appConfig } from "@/lib/config/app-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.publicUrl),
  title: {
    default: appConfig.productName,
    template: `%s | ${appConfig.productName}`,
  },
  description: appConfig.productDescription,
  applicationName: appConfig.productName,
  openGraph: {
    title: appConfig.productName,
    description: appConfig.productDescription,
    url: appConfig.publicUrl,
    siteName: appConfig.productName,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PerpArena simulated trading competition shell",
      },
    ],
  },
  icons: {
    icon: "/icon.svg",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
