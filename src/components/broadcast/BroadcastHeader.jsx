import { Radio, Check, ArrowLeft, ArrowRight, Send, Loader2 } from "lucide-react";
import { STEPS, BRAND, INK_FROM, INK_TO, BRAND_DARK } from "./constants";

function RoadConnector({ filled }) {
  return (
    <div className="flex-1 h-[3px] mx-2 rounded-full bg-gray-200 overflow-hidden relative">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
        style={{
          width: filled ? "100%" : "0%",
          backgroundImage: `repeating-linear-gradient(90deg, ${BRAND} 0px, ${BRAND} 7px, #ffffff 7px, #ffffff 11px)`,
        }}
      />
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="flex items-center w-full max-w-md">
      {STEPS.map((s, i) => {
        const state = step > s.n ? "done" : step === s.n ? "current" : "future";
        return (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all shrink-0 ${
                  state === "done"
                    ? "text-white border-transparent"
                    : state === "current"
                      ? "text-[#c41820] border-[#c41820] bg-red-50"
                      : "text-gray-300 border-gray-200 bg-white"
                }`}
                style={state === "done" ? { background: BRAND } : undefined}
              >
                {state === "done" ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                state === "future" ? "text-gray-300" : "text-gray-600"
              }`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <RoadConnector filled={step > s.n} />}
          </div>
        );
      })}
    </div>
  );
}

export default function BroadcastHeader({
  step, selectedCount, messageLength,
  canNext, sending, onBack, onNext, onSend,
}) {
  return (
    <>
      <div
        className="sticky top-0 z-30 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-black/10"
        style={{ background: `linear-gradient(135deg, ${INK_FROM} 0%, ${INK_TO} 100%)` }}
      >
        {/* Left — brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-white tracking-tight hidden sm:inline">Broadcast Campaign</span>
        </div>

        {/* Center — stepper */}
        <div className="hidden md:flex flex-1 justify-center">
          <Stepper step={step} />
        </div>

        {/* Right — context pill + nav buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border"
            style={{ background: "rgba(196,24,32,0.18)", borderColor: "rgba(196,24,32,0.35)", color: "#ffd9dc" }}
          >
            {step === 1 && `${selectedCount} selected`}
            {step === 2 && `${messageLength} chars`}
            {step === 3 && "Ready to send"}
          </span>

          {step > 1 && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              disabled={!canNext}
              onClick={onNext}
              className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl transition-all text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`, boxShadow: "0 4px 14px rgba(196,24,32,0.4)" }}
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled={sending}
              onClick={onSend}
              className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`, boxShadow: "0 4px 14px rgba(196,24,32,0.4)" }}
            >
              {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</> : <><Send className="w-3.5 h-3.5" /> Send</>}
            </button>
          )}
        </div>
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden px-4 pt-3">
        <Stepper step={step} />
      </div>
    </>
  );
}
