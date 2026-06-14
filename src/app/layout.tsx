import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
  title: {
    default: "AniKit — your anime, leveled up",
    template: "%s · AniKit",
  },
  description:
    "Free tools for your MyAnimeList & AniList life. Wrapped: a seasonal anime recap. List Builder: swipe to build, rate, and export your list. Nothing stored server-side.",
  keywords: [
    "AniKit",
    "Anime Tools",
    "MyAnimeList",
    "AniList",
    "Anime Wrapped",
    "Anime Recap",
    "Anime List Builder",
  ],
  openGraph: {
    title: "AniKit — your anime, leveled up",
    description: "Free anime tools for MyAnimeList & AniList: a seasonal Wrapped recap and a swipe-to-build List Builder.",
    url: "https://anime-anecdote.vercel.app",
    siteName: "AniKit",
  },
  metadataBase: new URL("https://anime-anecdote.vercel.app"),
};

const themeScript = `(function(){try{var t=localStorage.getItem('anikit-theme');document.documentElement.dataset.theme=(t==='dark'||t==='light')?t:'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${display.variable} ${techMono.variable} bg-base text-ink antialiased`}>
        <Script id="anikit-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <div className="relative min-h-screen">
          <div className="scanline" aria-hidden />
          {children}
        </div>
      </body>
    </html>
  );
}
