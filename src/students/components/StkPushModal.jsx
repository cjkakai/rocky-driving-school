import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Loader2, RefreshCw, CheckCircle, Clock, AlertTriangle,
  XCircle, Building2, Smartphone,
} from "lucide-react";
import { mpesaAPI } from "../../api/payments.api";

/**
 * Revised poll schedule — two-phase strategy.
 *
 * Phase A (polls 1-3, ~0-10s): backend returns DB status only.
 * Phase B (polls 4+): backend calls Co-op enquiry once per cycle.
 *
 * Total: 13 polls over ~75s. Poll 13 also carries ?final=1.
 */
const POLL_SCHEDULE = [
  { delay: 3000, count: 3 }, // Phase A — polls 1-3  (~0-9s)   DB only
  { delay: 4000, count: 4 }, // Phase B — polls 4-7  (~9-25s)  Co-op enquiry
  { delay: 6000, count: 3 }, // Phase B — polls 8-10 (~25-43s) Co-op enquiry
  { delay: 8000, count: 3 }, // Phase B — polls 11-13 (~43-67s) Co-op enquiry
];

// Four steps shown in the step indicator.
const STK_STEPS = [
  { key: "sent",      label: "Request sent"   },
  { key: "phone",     label: "Check phone"    },
  { key: "pin",       label: "Enter Co-op PIN"},
  { key: "confirmed", label: "Confirmed"      },
];

export function StkPushModal({ sc, balance, onClose, onSuccess }) {
  // ── Phase machine: "form" | "waiting" | "done" ──────────────────────────────
  const [phase,      setPhase]      = useState("form");
  const [phone,      setPhone]      = useState("");
  const [amount,     setAmount]     = useState(balance > 0 ? String(Math.ceil(balance)) : "");
  const [submitErr,  setSubmitErr]  = useState("");
  const [doneStatus, setDoneStatus] = useState(null);   // "success"|"failed"|"cancelled"|"timeout"
  const [doneDesc,   setDoneDesc]   = useState("");
  const [elapsed,    setElapsed]    = useState(0);      // seconds since push sent

  // Refs so callbacks always see current values without stale closures.
  const pollRef      = useRef(null);  // current scheduled setTimeout id
  const activeRef    = useRef(false); // false = polling stopped
  const elapsedRef   = useRef(null);  // setInterval for the elapsed-seconds ticker

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => {
    activeRef.current = false;
    clearTimeout(pollRef.current);
    clearInterval(elapsedRef.current);
  }, []);

  // ── Elapsed-seconds ticker ─────────────────────────────────────────────────
  const startTicker = () => {
    setElapsed(0);
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTicker = () => clearInterval(elapsedRef.current);

  // ── Resolve to "done" phase ────────────────────────────────────────────────
  const resolve = (status, desc = "") => {
    activeRef.current = false;
    clearTimeout(pollRef.current);
    stopTicker();
    setDoneStatus(status);
    setDoneDesc(desc);
    setPhase("done");
  };

  // ── Adaptive polling via chained setTimeout ────────────────────────────────
  const schedulePoll = (checkoutId, scheduleIdx, pollsInStep, pollNum) => {
    if (!activeRef.current) return;

    const step = POLL_SCHEDULE[scheduleIdx];
    if (!step) {
      mpesaAPI.getStatus(checkoutId, true, pollNum).catch(() => {});
      resolve("timeout");
      return;
    }

    const isLastPoll =
      scheduleIdx === POLL_SCHEDULE.length - 1 &&
      pollsInStep === step.count - 1;

    pollRef.current = setTimeout(async () => {
      if (!activeRef.current) return;

      try {
        const res = await mpesaAPI.getStatus(checkoutId, isLastPoll, pollNum);
        if (res.status !== "pending") {
          resolve(res.status, res.result_desc || "");
          return;
        }
      } catch {
        // Network hiccup — keep polling.
      }

      const nextPollsInStep = pollsInStep + 1;
      if (nextPollsInStep >= step.count) {
        schedulePoll(checkoutId, scheduleIdx + 1, 0, pollNum + 1);
      } else {
        schedulePoll(checkoutId, scheduleIdx, nextPollsInStep, pollNum + 1);
      }
    }, step.delay);
  };

  // ── Submit — send the STK push ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr("");
    const amt = parseInt(amount, 10);
    if (!phone.trim()) return setSubmitErr("Phone number is required.");
    if (!amt || amt <= 0) return setSubmitErr("Enter a valid amount.");

    setPhase("waiting");
    startTicker();

    try {
      const res = await mpesaAPI.stkPush(sc.id, phone.trim(), amt);
      activeRef.current = true;
      schedulePoll(res.checkout_request_id, 0, 0, 1);
    } catch (err) {
      stopTicker();
      setSubmitErr(err.message || "Failed to send STK Push.");
      setPhase("form");
    }
  };

  // ── Admin manually closes during waiting ──────────────────────────────────
  const handleClose = () => {
    if (phase === "waiting") {
      resolve(
        "timeout",
        "You closed the window. If the customer entered their PIN the payment will still reflect automatically.",
      );
    } else {
      onClose();
    }
  };

  // ── Retry — back to form with fields pre-filled ────────────────────────────
  const handleRetry = () => {
    setDoneStatus(null);
    setDoneDesc("");
    setSubmitErr("");
    setElapsed(0);
    setPhase("form");
  };

  // ── Derived display values ─────────────────────────────────────────────────
  // Progress bar: fills over 75 s total polling window.
  const progressPct = phase === "waiting" ? Math.min(100, (elapsed / 75) * 100) : 0;

  // Step indicator active step.
  // 0 = sent (immediately), 1 = check phone (0–9s), 2 = enter PIN (9–43s), 3 = confirmed (done).
  const activeStep =
    doneStatus === "success" ? 3
    : elapsed >= 9            ? 2
    : elapsed >= 1            ? 1
    : 0;

  // Done-state display config.
  const DONE_CONFIG = {
    success: {
      border:   "border-green-200",
      bg:       "bg-green-50",
      iconBg:   "bg-green-100",
      iconColor:"text-green-600",
      title:    "Payment confirmed",
      titleColor:"text-green-800",
    },
    failed: {
      border:   "border-red-200",
      bg:       "bg-red-50",
      iconBg:   "bg-red-100",
      iconColor:"text-red-600",
      title:    "Payment failed",
      titleColor:"text-red-700",
    },
    cancelled: {
      border:   "border-amber-200",
      bg:       "bg-amber-50",
      iconBg:   "bg-amber-100",
      iconColor:"text-amber-600",
      title:    "Cancelled by customer",
      titleColor:"text-amber-700",
    },
    timeout: {
      border:   "border-gray-200",
      bg:       "bg-gray-50",
      iconBg:   "bg-gray-100",
      iconColor:"text-gray-500",
      title:    "Request timed out",
      titleColor:"text-gray-700",
    },
  };
  const doneCfg = doneStatus ? DONE_CONFIG[doneStatus] ?? DONE_CONFIG.failed : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-teal-600 to-cyan-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Pay via Co-op Bank</p>
                <p className="text-[11px] text-white/70 font-medium truncate max-w-[160px]">{sc.course_name}</p>
              </div>
            </div>
            {/* Close is always available — no disabled state */}
            <button
              type="button"
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Operator + reference pill */}
          <div className="bg-white/15 rounded-xl px-3 py-2 font-mono text-[11px] text-white/90 flex items-center justify-between">
            <span>
              Operator <span className="font-black text-white">FIVESTAR</span>
            </span>
            {sc.payment_reference && (
              <span>
                Ref <span className="font-black text-white">{sc.payment_reference}</span>
              </span>
            )}
          </div>

          {/* Progress bar — only visible while waiting */}
          {phase === "waiting" && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] text-white/60 font-medium">
                <span>Waiting for confirmation…</span>
                <span className="tabular-nums font-bold text-white/80">{elapsed}s</span>
              </div>
              <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/80 transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-4">

          {/* ══ FORM phase ══ */}
          {phase === "form" && (
            <>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    min="1"
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {submitErr && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {submitErr}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  Send Push
                </button>
              </div>
            </>
          )}

          {/* ══ WAITING phase ══ */}
          {phase === "waiting" && (
            <>
              {/* Step indicator */}
              <div className="flex items-center justify-between">
                {STK_STEPS.map((step, i) => {
                  const isDone    = i < activeStep;
                  const isCurrent = i === activeStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                      {/* Connector line before this step */}
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div
                            className={`flex-1 h-0.5 transition-colors duration-500 ${
                              isDone ? "bg-teal-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                            isDone
                              ? "bg-teal-500 shadow-sm shadow-teal-200"
                              : isCurrent
                              ? "bg-teal-100 ring-2 ring-teal-400 ring-offset-1"
                              : "bg-gray-100"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          ) : isCurrent ? (
                            <Loader2 className="w-3 h-3 text-teal-600 animate-spin" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          )}
                        </div>
                        {i < STK_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 transition-colors duration-500 ${
                              i < activeStep - 1 ? "bg-teal-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-bold text-center leading-tight transition-colors ${
                          isDone
                            ? "text-teal-600"
                            : isCurrent
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Instructional callout */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <Smartphone className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-teal-800">
                    Co-op PIN prompt sent to {phone}
                  </p>
                  <p className="text-[11px] text-teal-600 mt-0.5 leading-snug">
                    Ask the customer to check their phone and enter their Co-op mobile banking PIN to complete the payment.
                  </p>
                </div>
              </div>

              {/* Escape hatch — admin can close at any time */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
                >
                  Close window
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center -mt-1 leading-snug">
                Closing doesn't cancel the request. If the customer enters their PIN, payment will still reflect.
              </p>
            </>
          )}

          {/* ══ DONE phase ══ */}
          {phase === "done" && doneCfg && (
            <>
              {/* Result card */}
              <div className={`border ${doneCfg.border} ${doneCfg.bg} rounded-xl px-4 py-4 flex items-start gap-3`}>
                <div className={`w-8 h-8 rounded-xl ${doneCfg.iconBg} flex items-center justify-center shrink-0`}>
                  {doneStatus === "success"   && <CheckCircle className={`w-4 h-4 ${doneCfg.iconColor}`} />}
                  {doneStatus === "failed"    && <XCircle     className={`w-4 h-4 ${doneCfg.iconColor}`} />}
                  {doneStatus === "cancelled" && <XCircle     className={`w-4 h-4 ${doneCfg.iconColor}`} />}
                  {doneStatus === "timeout"   && <Clock       className={`w-4 h-4 ${doneCfg.iconColor}`} />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${doneCfg.titleColor}`}>{doneCfg.title}</p>
                  {doneDesc && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{doneDesc}</p>
                  )}
                </div>
              </div>

              {/* Timeout-specific guidance */}
              {doneStatus === "timeout" && !doneDesc.includes("closed") && (
                <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    The customer may still be entering their PIN. If they complete the payment, it will reflect automatically — no need to retry yet.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
                {/* Show retry for any non-success terminal state */}
                {doneStatus !== "success" && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try Again
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
