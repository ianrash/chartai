import { Check, X } from "lucide-react";

const CHECKLIST_ITEMS = [
  { key: "ssl_swept", label: "SSL Swept" },
  { key: "fvg_present", label: "FVG Present" },
  { key: "htf_aligns_ltf", label: "HTF Aligns with LTF" },
  { key: "order_block_present", label: "Order Block Present" },
  { key: "session_favorable", label: "Session Favorable" },
  { key: "pattern_confirmed", label: "Pattern Confirmed" },
  { key: "inducement_swept", label: "Inducement Swept" },
];

export default function ConfluenceChecklist({ data }) {
  if (!data) return null;

  return (
    <div className="card h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-main flex items-center gap-2">
          <Check size={16} className="text-accent" />
          Confluence Checklist
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isTicked = !!data[item.key];
          return (
            <div key={item.key} className="flex items-center justify-between group">
              <span className={`text-sm ${isTicked ? 'text-text-main' : 'text-muted'}`}>
                {item.label}
              </span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${isTicked ? 'bg-bullish/20 border-bullish/40 text-bullish' : 'bg-white/5 border-white/10 text-muted/30'}`}>
                {isTicked ? <Check size={14} /> : <X size={14} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
