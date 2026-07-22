"use client";

import { useState } from "react";
import Image from "next/image";
import { LanguageSwitcher } from "./language-switcher";
import type { Locale } from "@/lib/locale";

type NavLink = { href: string; label: string; icon: string };

export function Sidebar({
  navLinks,
  navBadgeCount,
  currentLocale,
  signOutAction,
}: {
  navLinks: readonly NavLink[];
  navBadgeCount: Record<string, number>;
  currentLocale: Locale;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden flex items-center justify-between gap-2 bg-brand text-white px-4 py-3 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <a href="/dashboard" className="inline-block bg-white/10 rounded-lg p-1">
          <Image src="/rnp-logo.jpg" alt="RNP Express" width={28} height={28} unoptimized className="rounded w-7 h-7" />
        </a>
        <div className="w-9" />
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-64 md:w-60 flex-none bg-brand text-white flex flex-col p-4 gap-1 h-screen overflow-y-auto transition-transform duration-200 ease-in-out md:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-2 mb-6">
          <a href="/dashboard" className="inline-block bg-white/10 rounded-xl p-1.5 w-fit">
            <Image
              src="/rnp-logo.jpg"
              alt="RNP Express"
              width={40}
              height={40}
              unoptimized
              className="rounded-lg w-10 h-10"
            />
          </a>
          <div className="flex items-center gap-1">
            <LanguageSwitcher current={currentLocale} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิดเมนู"
              className="md:hidden p-1.5 rounded-lg hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              <NavIcon name={link.icon} />
              <span className="flex-1">{link.label}</span>
              {!!navBadgeCount[link.href] && (
                <span className="flex-none bg-white text-brand text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {navBadgeCount[link.href]}
                </span>
              )}
            </a>
          ))}
        </nav>

        <form action={signOutAction} className="mt-auto">
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            <NavIcon name="logout" />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </aside>
    </>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "flex-none",
  };

  switch (name) {
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M4 21V4" />
          <path d="M4 4h13l-2.5 4L17 12H4" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 00-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0012 3z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "team":
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    default:
      return null;
  }
}
