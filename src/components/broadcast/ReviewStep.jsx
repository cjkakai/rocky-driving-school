import { SmartphoneNfc } from "lucide-react";
import { Card, SectionLabel } from "./primitives";
import { BRAND, BRAND_DARK, INK_TO } from "./constants";

export default function ReviewStep({ previewStudent, message, selectedCount, smsCount, totalSms, audienceFilters }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-4xl mx-auto">
      <div className="lg:col-span-5">
        <Card>
          <div
            className="px-5 py-3.5 flex items-center gap-2.5"
            style={{ background: `linear-gradient(135deg, ${INK_TO}, ${BRAND})` }}
          >
            <SmartphoneNfc className="w-4 h-4 text-white/80" />
            <span className="text-sm font-extrabold text-white">SMS preview</span>
          </div>
          <div className="p-5">
            <div className="mx-auto w-48 rounded-3xl border-4 border-gray-800 bg-gray-900 overflow-hidden shadow-xl">
              <div className="bg-gray-800 h-5 flex items-center justify-center gap-1.5">
                <div className="w-8 h-1 bg-gray-600 rounded-full" />
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
              </div>
              <div className="bg-white min-h-[150px] p-3 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">
                  {previewStudent ? "To" : "Preview"}
                </p>
                {previewStudent && (
                  <>
                    <p className="text-xs font-extrabold text-gray-900 leading-tight">{previewStudent.full_name}</p>
                    <p className="text-[10px] text-gray-400 tabular-nums">{previewStudent.phone}</p>
                  </>
                )}
                <div className="border-t border-gray-100 pt-2">
                  <p className="text-[11px] text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <Card>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Recipients", value: selectedCount },
                { label: "SMS each",   value: smsCount },
                { label: "Total SMS",  value: totalSms },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl py-3 border" style={{ background: "#fdf1f2", borderColor: "#f6d3d5" }}>
                  <p className="text-xl font-black tabular-nums" style={{ color: BRAND }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: BRAND_DARK }}>{label}</p>
                </div>
              ))}
            </div>

            {audienceFilters.length > 0 && (
              <div>
                <SectionLabel>Audience</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {audienceFilters.map((f, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionLabel>Message</SectionLabel>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
