import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LEXI AI®",
  description: "NEXT GENERATION OF AI-DEVELOPMENT.",
  openGraph: {
    url: "https://www.lexiai.com/",
    title: "LEXI AI®",
    description: "NEXT GENERATION OF AI-DEVELOPMENT.",
    type: "website",
    images: [
      {
        url: "https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary",
    site: "@LEXIAI",
    title: "LEXI AI®",
    description: "NEXT GENERATION OF AI-DEVELOPMENT.",
    images: ["https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-grab/dist/index.global.js"
        />
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />
        <Script id="context-menu-lock" strategy="beforeInteractive">
          {`
            if (document.addEventListener) {
              document.addEventListener('contextmenu', function (e) {
                e.preventDefault();
              }, false);
            } else {
              document.attachEvent('oncontextmenu', function () {
                window.event.returnValue = false;
              });
            }
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
