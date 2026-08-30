import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Poppins, Roboto, Montserrat, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Fase 4 — tema por empresa: lista curada de ~6 fontes, todas carregadas de
// uma vez aqui via next/font (build-time, auto-hospedadas, sem FOUC) e
// disponibilizadas como CSS variables no <html>. Qual delas é efetivamente
// usada em cada request é decidido depois, por
// app/loja/[companySlug]/layout.tsx, sobrescrevendo só --font-sans-active
// (ver globals.css) — o navegador só baixa o arquivo da fonte que
// realmente é aplicada a algum texto na página, então ter as 6 disponíveis
// não pesa no carregamento de quem usa qualquer uma delas isoladamente.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

const CURATED_FONT_VARIABLES = [geistSans, geistMono, inter, poppins, roboto, montserrat, playfair]
  .map((f) => f.variable)
  .join(" ");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "MartWeb — Sua loja online completa",
    template: "%s | MartWeb",
  },
  description:
    "MartWeb: milhares de produtos com os melhores preços, entrega rápida e pagamento seguro.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "MartWeb",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${CURATED_FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
