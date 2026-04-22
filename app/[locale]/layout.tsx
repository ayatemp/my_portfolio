import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import Navigation from "@/components/Navigation";
import { getDictionary, normalizeLocale } from "@/lib/getDictionary";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateStaticParams() {
  return [{ locale: "ja" }, { locale: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const isJa = locale === "ja";
  return {
    title: {
      default: "Portfolio — ML Engineer & Researcher",
      template: "%s | Portfolio",
    },
    description: isJa
      ? "青山学院大学大学院 実世界通信研究室。HCI・人間拡張からActive Learning・LLMまで、研究とPoCの境界を走るMLエンジニア。"
      : "ML Engineer at the boundary of research and PoC — HCI, human augmentation, Active Learning, LLMs.",
    icons: {
      icon: "/icon.png",
      shortcut: "/icon.png",
      apple: "/apple-icon.png",
    },
    openGraph: {
      type: "website",
      locale: isJa ? "ja_JP" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = normalizeLocale(localeParam);
  const dict = await getDictionary(locale);

  return (
    <html lang={locale} className="dark">
      <body>
        <Navigation locale={locale} navDict={dict.nav} />
        <main>{children}</main>
      </body>
    </html>
  );
}
