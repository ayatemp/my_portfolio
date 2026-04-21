"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { Dictionary, Locale } from "@/lib/getDictionary";

type NavProps = {
  locale: Locale;
  navDict: Dictionary["nav"];
};

export default function Navigation({ locale, navDict }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: navDict.home },
    { href: `/${locale}/research`, label: navDict.research },
    { href: `/${locale}/articles`, label: navDict.articles },
    { href: `/${locale}/projects`, label: navDict.projects },
  ];

  const otherLocale: Locale = locale === "ja" ? "en" : "ja";

  function switchLocale() {
    const withoutLocale = pathname.replace(/^\/(ja|en)/, "") || "";
    router.push(`/${otherLocale}${withoutLocale}`);
  }

  function isActive(href: string) {
    if (href === `/${locale}`) return pathname === `/${locale}`;
    return pathname.startsWith(href);
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#06060F]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <span
            className="font-mono text-xs text-accent-cyan opacity-60 group-hover:opacity-100 transition-opacity"
            aria-hidden
          >
            ./
          </span>
          <span className="font-display text-lg font-semibold text-text-primary tracking-tight">
            {locale === "ja" ? "加来彩人" : "Ayato Kaku"}
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`font-mono text-xs tracking-widest uppercase transition-colors duration-200 ${
                  isActive(href)
                    ? "text-accent-cyan"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: status + language switcher */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={switchLocale}
            className="font-mono text-[10px] tracking-widest uppercase border border-white/10 text-text-muted px-2 py-1 rounded-sm hover:border-accent-cyan/40 hover:text-accent-cyan transition-all"
          >
            {otherLocale.toUpperCase()}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-[6px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-text-primary transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-[6px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#0D0D1C]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 py-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="font-mono text-xs tracking-widest uppercase text-text-secondary hover:text-accent-cyan transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => { setMenuOpen(false); switchLocale(); }}
                className="font-mono text-xs tracking-widest uppercase text-text-secondary hover:text-accent-cyan transition-colors"
              >
                {otherLocale.toUpperCase()} (Switch language)
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
