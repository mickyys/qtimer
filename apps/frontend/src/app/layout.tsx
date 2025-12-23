import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "./context/NextAuthProvider";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuintaTimer | Resultados Oficiales",
  description: "Cronometraje deportivo · Resultados oficiales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-slate-900">
      <body className={`${inter.className} bg-slate-900 text-white relative min-h-screen flex flex-col overflow-x-hidden`}>
        <NextAuthProvider>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <WhatsAppButton />
        </NextAuthProvider>
      </body>
    </html>
  );
}
