import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./ui/playlists/nextauthprovider";
import { ThemeProvider } from "./ui/theme-provider";
import HeaderControls from "./ui/header-controls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotify Playlist Shuffler",
  description: "Shuffle your Spotify playlists with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NextAuthProvider>
            <header className="max-w-2xl mx-auto px-6 pt-6 pb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Spotify Playlist Shuffler</h1>
              <HeaderControls />
            </header>
            {children}
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
