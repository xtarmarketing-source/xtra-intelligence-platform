"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import type { Locale } from "@/lib/locale";

const LOCALE_LABEL: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
  zh: "中文",
};

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={current}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Locale;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
      className="bg-white/10 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-white/20 outline-none disabled:opacity-60"
    >
      {(Object.entries(LOCALE_LABEL) as [Locale, string][]).map(([value, label]) => (
        <option key={value} value={value} className="text-ink">
          {label}
        </option>
      ))}
    </select>
  );
}
