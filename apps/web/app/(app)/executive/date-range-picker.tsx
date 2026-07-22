const PRESETS = [
  { key: "today", label: "วันนี้" },
  { key: "week", label: "สัปดาห์นี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
] as const;

export function DateRangePicker({
  activePreset,
  from,
  to,
}: {
  activePreset: string;
  from: string;
  to: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-line rounded-2xl p-3">
      <div className="flex gap-1 flex-wrap">
        {PRESETS.map((p) => (
          <a
            key={p.key}
            href={`/executive?preset=${p.key}`}
            className={`text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
              activePreset === p.key ? "bg-brand text-white" : "text-ink-soft hover:bg-line-soft"
            }`}
          >
            {p.label}
          </a>
        ))}
      </div>
      <form action="/executive" method="get" className="flex items-center gap-2 flex-wrap">
        <input type="hidden" name="preset" value="custom" />
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="border border-line rounded-lg px-2 py-1.5 text-xs"
        />
        <span className="text-ink-soft text-xs">ถึง</span>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="border border-line rounded-lg px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          className={`text-xs font-semibold border rounded-lg px-3 py-1.5 transition-colors ${
            activePreset === "custom"
              ? "bg-brand text-white border-brand"
              : "border-brand text-brand hover:bg-brand-tint"
          }`}
        >
          กำหนดเอง
        </button>
      </form>
    </div>
  );
}
