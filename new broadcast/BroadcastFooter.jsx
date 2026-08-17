import { ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { BRAND, BRAND_DARK } from "./constants";

export default function BroadcastFooter({
  step, selectedCount, canNext, sending, onBack, onNext, onSend,
}) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 md:px-6 py-3.5 flex items-center justify-between z-20">
      <div>
        {step > 1 ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 px-4 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <span className="text-xs text-gray-400 font-medium px-1">
            {selectedCount === 0
              ? "Select at least one student to continue"
              : `${selectedCount} student${selectedCount !== 1 ? "s" : ""} selected`}
          </span>
        )}
      </div>

      {step < 3 ? (
        <button
          disabled={!canNext}
          onClick={onNext}
          className="flex items-center gap-1.5 font-extrabold px-5 py-2.5 rounded-xl transition-all text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`, boxShadow: "0 4px 14px rgba(196,24,32,0.3)" }}
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          disabled={sending}
          onClick={onSend}
          className="flex items-center gap-2 font-extrabold px-5 py-2.5 rounded-xl transition-all text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`, boxShadow: "0 4px 14px rgba(196,24,32,0.35)" }}
        >
          {sending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
          ) : (
            <><Send className="w-4 h-4" /> Send campaign</>
          )}
        </button>
      )}
    </div>
  );
}
