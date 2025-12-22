import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "./context/NextAuthProvider";

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
    <html lang="es">
      <body className={`${inter.className} bg-slate-900 text-white relative overflow-x-hidden`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
