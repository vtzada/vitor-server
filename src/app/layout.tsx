import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { LEAKED_JWT } from "@/lib/jwt";
import { BOOT_SEEN_SCRIPT } from "@/components/boot/BootIntro";
import { ServerShell } from "@/components/ServerShell";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "vitor-server :: Vitor Theodoro",
  description:
    "Portfólio do Vitor Theodoro, dev backend Java/Spring. O site é um servidor rodando: cada clique vira uma requisição.",
  // TODO(dev): remover token de debug antes do deploy. (não removi, é um easter egg)
  other: { "x-debug-token": LEAKED_JWT },
};

export const viewport: Viewport = {
  themeColor: "#05070b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${code.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Esconde o boot antes do primeiro paint para quem já o viu nesta sessão. */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SEEN_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <ServerShell>{children}</ServerShell>
      </body>
    </html>
  );
}
