import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import "./globals.css";

const soriaFont = localFont({
  src: "../public/soria-font.ttf",
  variable: "--font-soria",
});

const vercettiFont = localFont({
  src: "../public/Vercetti-Regular.woff",
  variable: "--font-vercetti",
});

const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.GA_MEASUREMENT_ID ||
  "";

export const metadata: Metadata = {
  metadataBase: new URL("https://odysseus707.github.io"),
  title: "Vivek Rai",
  description: "ML Engineer by profession, creative at heart.",
  keywords: "Vivek Rai, ML Engineer, Portfolio",
  authors: [{ name: "Vivek Rai" }],
  creator: "Vivek Rai",
  publisher: "Vivek Rai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Vivek Rai - ML Engineer",
    description: "ML engineer by profession, creative at heart.",
    url: "https://odysseus707.github.io",
    siteName: "Vivek Rai's Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivek Rai - ML Engineer",
    description: "ML engineer by profession, creative at heart.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overscroll-y-none">
      <body
        className={`${soriaFont.variable} ${vercettiFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
