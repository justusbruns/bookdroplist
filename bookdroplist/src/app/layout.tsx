import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Book Drop List - Create and Share Your Book Lists",
  description: "Create beautiful book lists from photos or manual entry. Share your reading collection with location-based discovery. Perfect for book sharing, recommendations, and community building.",
  keywords: ["books", "reading", "book lists", "book sharing", "reading community", "book recommendations", "library"],
  authors: [{ name: "Book Drop List" }],
  creator: "Book Drop List",
  publisher: "Book Drop List",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Book Drop List',
    title: 'Book Drop List - Create and Share Your Book Lists',
    description: 'Create beautiful book lists from photos or manual entry. Share your reading collection with location-based discovery.',
    images: [
      {
        url: '/logo.svg',
        width: 400,
        height: 400,
        alt: 'Book Drop List Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Book Drop List - Create and Share Your Book Lists',
    description: 'Create beautiful book lists from photos or manual entry. Share your reading collection with location-based discovery.',
    images: ['/logo.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
