import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const techMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-tech",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Anime Anecdote",
  description: "A neon anime recap fueled by fresh MyAnimeList data.",
  keywords: ["Anime Recap", "MyAnimeList", "Anime Analytics", "2025 Anime Stats"],
  openGraph: {
    title: "Anime Anecdote",
    description: "A glowing MAL-powered recap for your watchlist.",
    url: "https://anime-anecdote.vercel.app",
    siteName: "Anime Anecdote",
  },
  metadataBase: new URL("https://anime-anecdote.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${techMono.variable} bg-night text-snow antialiased`}>
        <div className="radial-mask">
          <div className="scanline" aria-hidden />
          {children}
        </div>
      </body>
    </html>
  );
}
