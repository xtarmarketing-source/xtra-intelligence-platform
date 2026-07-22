"use client";

import { useState } from "react";

export type FunnelDeal = {
  id: string;
  companyId: string;
  companyName: string;
  serviceType: string;
  value: number;
  weightKg: number | null;
};

export type FunnelStage = {
  stage: string;
  label: string;
  accent: string;
  count: number;
  value: number;
  deals: FunnelDeal[];
};

const PREVIEW_COUNT = 4;

export function SalesFunnel({ stages }: { stages: FunnelStage[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {stages.map((s) => {
        const isExpanded = !!expanded[s.stage];
        const visibleDeals = isExpanded ? s.deals : s.deals.slice(0, PREVIEW_COUNT);
        const remaining = s.deals.length - visibleDeals.length;

        return (
          <div
            key={s.stage}
            className="flex-none w-52 border border-line rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col"
          >
            <div className={`h-1.5 ${s.accent}`} />
            <div className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wide">{s.label}</span>
                <span className="text-sm font-extrabold text-ink">{s.count}</span>
              </div>

              <div className="flex flex-col gap-1">
                {visibleDeals.map((d) => (
                  <a
                    key={d.id}
                    href={`/companies/${d.companyId}`}
                    className="block rounded-lg px-2 py-1.5 hover:bg-line-soft transition-colors"
                  >
                    <div className="text-xs font-semibold text-ink truncate">{d.companyName}</div>
                    <div className="text-xs text-ink-soft truncate">{d.serviceType}</div>
                  </a>
                ))}

                {s.deals.length === 0 && (
                  <p className="text-xs text-ink-soft px-2 py-1">ไม่มีดีล</p>
                )}

                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [s.stage]: true }))}
                    className="text-xs text-brand font-semibold px-2 text-left hover:underline"
                  >
                    +{remaining} เพิ่มเติม
                  </button>
                )}

                {isExpanded && s.deals.length > PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [s.stage]: false }))}
                    className="text-xs text-ink-soft px-2 text-left hover:underline"
                  >
                    ย่อกลับ
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
