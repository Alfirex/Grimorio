import type { Metadata } from "next";
import Script from "next/script";
import { Alegreya, Cinzel } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DiceRoller } from "@/components/dice/DiceRoller";
import "./globals.css";
import "@/styles/globals.scss";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grimorio — Mesa virtual de rol 5e",
  description:
    "Mesa virtual para partidas de rol 5e: fichas de personaje, campañas, tablero táctico, iniciativa, dados y generador de mapas. Compatible con el SRD 5.1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cinzel.variable} ${alegreya.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{children}</main>
          <Footer />
          <DiceRoller />
        </AuthProvider>
        {/* Google AdSense (anuncios automáticos): solo se carga si está configurado */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
