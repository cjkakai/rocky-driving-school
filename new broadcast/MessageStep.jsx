import { X, AlignLeft, Hash, Users } from "lucide-react";
import { Card, SectionLabel } from "./primitives";
import { TEMPLATES, BRAND, INK_FROM, INK_TO } from "./constants";

export default function MessageStep({ message, setMessage, selectedCount, audienceSummary, smsCount }) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Persistent audience context — don't lose track of who this goes to */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
        <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span>
          Messaging <span className="font-black text-gray-800">{selectedCount}</span> student{selectedCount !== 1 ? "s" : ""}
          {audienceSummary ? <span className="text-gray-400"> · {audienceSummary}</span> : null}
        </span>
      </div>

      <Card>
        <div className="p-5 space-y-4">
          <div>
            <SectionLabel>Quick templates</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((tpl) => {
                const active = message === tpl.text;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setMessage(tpl.text)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      active
                        ? "border-[#c41820] bg-red-50/70"
                        : "border-gray-100 bg-gray-50/40 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <p className={`text-xs font-extrabold mb-1 ${active ? "text-[#c41820]" : "text-gray-700"}`}>
                      {tpl.label}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">{tpl.text}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={9}
              maxLength={320}
              autoFocus
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#c41820]/30 focus:border-[#c41820] bg-gray-50/60 leading-relaxed transition-all"
              placeholder="Type your message here…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {message && (
              <button
                onClick={() => setMessage("")}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <AlignLeft className="w-3 h-3" />
                <span className="tabular-nums font-bold text-gray-700">{message.length}</span>
                <span>/ 320 chars</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                <span className="font-bold text-gray-700">{smsCount}</span>
                <span>SMS / recipient</span>
              </span>
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              message.length > 160
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {message.length > 160 ? "2-part SMS" : "Single SMS"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
