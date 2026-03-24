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

  icons: {
    icon: "https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png",
    shortcut:
      "https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png",
    apple:
      "https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png",
  },

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
    images: [
      "https://raw.githubusercontent.com/lexiaipro282/lexi-ai/refs/heads/main/assets/favicon/apple-touch-icon.png.png",
    ],
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

        {/* Optional helper scripts */}
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-grab/dist/index.global.js"
        />
        <Script
          crossOrigin="anonymous"
          src="//unpkg.com/same-runtime/dist/index.global.js"
        />

        {/* Advanced Content Lock */}
        <Script id="content-lock" strategy="beforeInteractive">
          {`
(function () {

  // Disable right click
  document.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  });

  // Disable copy / cut / paste
  ["copy","cut","paste"].forEach(function(evt){
    document.addEventListener(evt,function(e){
      e.preventDefault();
    });
  });

  // Disable text selection
  document.addEventListener("selectstart", function(e){
    e.preventDefault();
  });

  // Disable drag
  document.addEventListener("dragstart", function(e){
    e.preventDefault();
  });

  // Disable common devtools keys
  document.addEventListener("keydown", function(e){

    if (e.keyCode === 123) { // F12
      e.preventDefault();
    }

    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) { // Ctrl+Shift+I
      e.preventDefault();
    }

    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) { // Ctrl+Shift+J
      e.preventDefault();
    }

    if (e.ctrlKey && e.keyCode === 85) { // Ctrl+U
      e.preventDefault();
    }

    if (e.ctrlKey && e.keyCode === 67) { // Ctrl+C
      e.preventDefault();
    }

  });

  // DevTools detection
  setInterval(function () {
    const threshold = 160;

    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      document.body.innerHTML = "";
    }
  }, 1000);

})();
`}
        </Script>
      </head>

      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}