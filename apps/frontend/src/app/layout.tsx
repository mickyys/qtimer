import type { Metadata } from "next";
import { Inter, Righteous, Orbitron } from "next/font/google";
import "./styles/globals.css";
import NextAuthProvider from "./context/NextAuthProvider";
import { ModalProvider } from "@/context/ModalContext";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const inter = Inter({ subsets: ["latin"] });
const righteous = Righteous({ weight: "400", subsets: ["latin"] });
const orbitron = Orbitron({ weight: ["400", "700", "900"], subsets: ["latin"] });

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
          <ModalProvider>
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
          </ModalProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
