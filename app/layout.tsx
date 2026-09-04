import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Dilo — Spanish from first words to fluency";
  const description = "A complete CEFR A1–C2 Spanish learning path with spaced recall, grammar, listening, reading, speaking missions, corrections, and saved progress.";

  return {
    title,
    description,
    metadataBase: new URL(origin),
    applicationName: "Dilo",
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/icons/icon-192.png",
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "Dilo — Spanish from first words to fluency" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
    appleWebApp: { capable: true, title: "Dilo", statusBarStyle: "black-translucent" },
  };
}

export const viewport: Viewport = { themeColor: "#142a33", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head><link rel="manifest" href="/manifest.webmanifest" /></head>
      <body>{children}</body>
    </html>
  );
}
