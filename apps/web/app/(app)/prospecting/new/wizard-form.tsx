import { createSearchJob } from "@/lib/actions/search-jobs";
import { PRODUCT_CATEGORIES, BUSINESS_TYPES } from "@/lib/constants";

type BusinessUnit = {
  id: string;
  name: string;
  services: string[];
};

const chip =
  "border rounded-full px-4 py-2 text-sm cursor-pointer select-none border-line bg-white text-ink transition-all hover:border-brand/40 hover:bg-brand-tint/40 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-checked:font-semibold peer-checked:shadow-sm";

// Same visual style as `chip` (colors/border/hover/checked states untouched) — only layout
// differs: fixed 44px height + consistent horizontal padding so product-name chips of very
// different lengths (e.g. "SME" vs "ผลิตภัณฑ์ยางพารา (หมอน/ที่นอนยาง)") line up evenly and
// don't collide when wrapping across rows.
const productChip =
  "h-11 inline-flex items-center justify-center text-center leading-tight border rounded-full px-5 text-sm cursor-pointer select-none border-line bg-white text-ink transition-all hover:border-brand/40 hover:bg-brand-tint/40 peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-checked:font-semibold peer-checked:shadow-sm";

const tradeCard =
  "flex-1 flex flex-col gap-1 border-2 rounded-2xl p-5 cursor-pointer select-none transition-all border-line bg-white text-ink hover:border-brand/40 hover:shadow-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-checked:shadow-md";

function StepHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-none w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <div>
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      </div>
    </div>
  );
}

export function WizardForm({ businessUnits }: { businessUnits: BusinessUnit[] }) {
  return (
    <form action={createSearchJob} className="flex flex-col gap-4 pb-24">
      <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <StepHeader step={1} title="ทิศทางการค้า" hint="เลือก 1 รายการ (บังคับ)" />
        <div className="flex gap-3">
          {[
            {
              value: "export",
              label: "Export",
              desc: "หาลูกค้าที่ต้องการส่งออก",
              icon: "↗",
            },
            {
              value: "import",
              label: "Import",
              desc: "หาลูกค้าที่ต้องการนำเข้า",
              icon: "↙",
            },
          ].map((opt) => (
            <label key={opt.value} className="flex-1 flex">
              <input
                type="radio"
                name="trade_direction"
                value={opt.value}
                defaultChecked={opt.value === "export"}
                className="peer sr-only"
                required
              />
              <span className={tradeCard}>
                <span className="text-xl">{opt.icon}</span>
                <span className="font-bold">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <StepHeader
          step={2}
          title="สินค้าเป้าหมาย"
          hint="เรียงตามหมวดสินค้าส่งออกยอดนิยม — เลือกได้หลายรายการ (บังคับ)"
        />
        <div className="flex flex-wrap gap-3 items-start">
          {PRODUCT_CATEGORIES.map((p) => (
            <label key={p.code} className="basis-[calc(50%-6px)] sm:basis-auto">
              <input
                type="checkbox"
                name="product_categories"
                value={p.code}
                className="peer sr-only"
              />
              <span className={`${productChip} w-full sm:w-auto`}>{p.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <StepHeader step={3} title="ประเภทอุตสาหกรรม" hint="เลือกได้หลายรายการ (บังคับ)" />
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TYPES.map((t) => (
            <label key={t}>
              <input type="checkbox" name="business_types" value={t} className="peer sr-only" />
              <span className={chip}>{t}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
        <StepHeader step={4} title="บริการที่ต้องการขาย" hint="เลือกได้หลายรายการ (บังคับ)" />
        {businessUnits.length === 0 && (
          <p className="text-sm text-warn">
            ไม่พบ Business Unit ในระบบ — ตรวจสอบว่ารัน seed migration แล้วหรือยัง
          </p>
        )}
        <div className="flex flex-col gap-3">
          {businessUnits.map((unit) => (
            <div key={unit.id} className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {unit.name}
              </span>
              <div className="flex flex-wrap gap-2">
                {(unit.services ?? []).map((service) => (
                  <label key={`${unit.id}-${service}`}>
                    <input
                      type="checkbox"
                      name="services"
                      value={`${unit.id}::${service}`}
                      className="peer sr-only"
                    />
                    <span className={chip}>{service}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-60 right-0 bg-white/95 backdrop-blur border-t border-line">
        <div className="max-w-3xl px-8 py-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">
            ประมาณ 20-30 บริษัท · ใช้เวลาประมาณ 5-10 นาที (AI จะเข้าไปอ่านเว็บไซต์แต่ละบริษัทจริง)
          </span>
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-bold rounded-lg px-6 py-2.5 text-sm shadow-sm"
          >
            AI Find Customers
          </button>
        </div>
      </div>
    </form>
  );
}
