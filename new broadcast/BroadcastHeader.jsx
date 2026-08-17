import { ArrowLeft, Radio, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { STEPS, BRAND, INK_FROM, INK_TO } from "./constants";

/* Road-marking styled progress connector — a lane line that fills solid
   as the wizard advances. The one deliberate signature detail on the
   page: everything else stays quiet so this reads clearly. */
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
              <span
                className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                  state === "future" ? "text-gray-300" : "text-gray-600"
                }`}
              >
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

export default function BroadcastHeader({ step, selectedCount, messageLength }) {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="sticky top-0 z-30 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-black/10"
        style={{ background: `linear-gradient(135deg, ${INK_FROM} 0%, ${INK_TO} 100%)` }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-white tracking-tight hidden sm:inline">Broadcast Campaign</span>
        </div>

        <div className="hidden md:flex">
          <Stepper step={step} />
        </div>

        <div className="shrink-0">
          <span
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border backdrop-blur"
            style={{ background: "rgba(196,24,32,0.18)", borderColor: "rgba(196,24,32,0.35)", color: "#ffd9dc" }}
          >
            {step === 1 && `${selectedCount} selected`}
            {step === 2 && `${messageLength} chars`}
            {step === 3 && "Ready to send"}
          </span>
        </div>
      </div>

      <div className="md:hidden px-4 pt-3">
        <Stepper step={step} />
      </div>
    </>
  );
}
