import { Check, X, ListChecks } from "lucide-react";

const CHECKLIST_ITEMS = [
  { key: "htf_trend_aligned", label: "HTF Trend Aligned" },
  { key: "price_at_valid_ob_or_fvg", label: "Price at Valid OB or FVG" },
  { key: "choch_or_bos_confirmed", label: "CHoCH or BOS Confirmed" },
  { key: "displacement_present", label: "Displacement Present" },
  { key: "session_active", label: "Session Active" },
  { key: "kill_zone_active", label: "Kill Zone Active" },
];

export default function ConfluenceChecklist({ data }) {
  if (!data) return null;

  const tickedCount = CHECKLIST_ITEMS.filter((item) => !!data[item.key]).length;

  return (
    <div className="card h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="icon-tile icon-tile-accent">
            <ListChecks size={15} />
          </div>
          <span className="label">Confluence Checklist</span>
        </div>
        <span
          className={`badge mono ${tickedCount === CHECKLIST_ITEMS.length ? "chip-bullish" : "chip-accent"}`}
        >
          {tickedCount}/{CHECKLIST_ITEMS.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isTicked = !!data[item.key];
          return (
            <div key={item.key} className="flex items-center justify-between group">
              <span
                className="text-[13px] transition-colors"
                style={{ color: isTicked ? "var(--text-main)" : "var(--text-secondary)" }}
              >
                {item.label}
              </span>
              <div
                className="w-[18px] h-[18px] rounded-md flex items-center justify-center transition-colors"
                style={
                  isTicked
                    ? {
                        background: "var(--bullish-glow)",
                        border: "1px solid rgba(8, 153, 129, 0.4)",
                        color: "var(--bullish)",
                      }
                    : {
                        background: "var(--surface-3)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                      }
                }
              >
                {isTicked ? <Check size={12} /> : <X size={11} style={{ opacity: 0.6 }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
