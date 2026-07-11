import type { Metadata } from "next";
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
  title: "Grimorio — Gestor de partidas de D&D",
  description:
    "Gestiona tus campañas de Dungeons & Dragons: fichas de personaje, notas del máster, iniciativa, dados y generador de mapas.",
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
      </body>
    </html>
  );
}
