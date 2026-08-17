import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Btn, Toast, useToast } from "../ui";
import { useAuth } from "../context/AuthContext";
import { expensesAPI } from "../api/expenses.api";
import { targetsAPI } from "../api/targets.api";
import { TargetOverviewCard } from "../components/targets/TargetOverviewCard";
import { TargetBranchChart } from "../components/targets/TargetBranchChart";
import { TargetTrend } from "../components/targets/TargetTrend";
import { TargetSummaryTable } from "../components/targets/TargetSummaryTable";
import { SetTargetModal } from "../components/targets/SetTargetModal";
import { SearchableSelect } from "../ui";

function shiftWeek({ year, week }, delta) {
  const jan4 = Date.UTC(year, 0, 4);
  const dayOfWeek = new Date(jan4).getUTCDay() || 7;
  const monday = new Date(jan4 + (1 - dayOfWeek) * 86400000 + (week - 1) * 7 * 86400000);
  monday.setUTCDate(monday.getUTCDate() + delta * 7);
  const dt = new Date(monday);
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  return { year: dt.getUTCFullYear(), week: Math.ceil((((dt - yearStart) / 86400000) + 1) / 7) };
}

function weekLabel({ year, week }) {
  const jan4 = Date.UTC(year, 0, 4);
  const dayOfWeek = new Date(jan4).getUTCDay() || 7;
  const monday = new Date(jan4 + (1 - dayOfWeek) * 86400000 + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `W${week} · ${fmt(monday)} – ${fmt(sunday)}`;
}

function shiftMonth({ year, month }, delta) {
  let m = month + delta;
  let y = year;
  if (m > 12) { m -= 12; y += 1; }
  if (m < 1)  { m += 12; y -= 1; }
  return { year: y, month: m };
}

function monthLabel({ year, month }) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function Targets() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";

  const [metric, setMetric]             = useState("revenue");
  const [serverPeriod, setServerPeriod] = useState(null);
  const [weekPeriod, setWeekPeriod]     = useState(null);
  const [monthPeriod, setMonthPeriod]   = useState(null);
  const [branches, setBranches]         = useState([]);
  const [branchId, setBranchId]         = useState("");
  const [modalOpen, setModalOpen]       = useState(false);
  const { toast, show, hide }           = useToast();

  useEffect(() => {
    targetsAPI.currentPeriod().then((p) => {
      setServerPeriod(p);
      setWeekPeriod({ year: p.year, week: p.week });
      setMonthPeriod({ year: p.year, month: p.month });
    }).catch(() => {});
    if (isAdmin) expensesAPI.branches().then(setBranches).catch(() => {});
  }, [isAdmin]);

  const effectiveBranchId = isAdmin ? branchId : (user?.branch_id ?? "");

  const periodParams = weekPeriod && monthPeriod
    ? metric === "revenue"
      ? { year: weekPeriod.year, week: weekPeriod.week }
      : { year: monthPeriod.year, month: monthPeriod.month }
    : null;

  const isCurrentPeriod = serverPeriod && weekPeriod && monthPeriod && (
    metric === "revenue"
      ? weekPeriod.year === serverPeriod.year && weekPeriod.week === serverPeriod.week
      : monthPeriod.year === serverPeriod.year && monthPeriod.month === serverPeriod.month
  );

  const selectedBranchName = branches.find((b) => String(b.id) === String(branchId))?.name;

  function PeriodNav() {
    if (!weekPeriod || !monthPeriod) return null;
    if (metric === "revenue") {
      return (
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setWeekPeriod((p) => shiftWeek(p, -1))} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <span className="text-xs font-semibold text-gray-700 px-2 min-w-[160px] text-center">{weekLabel(weekPeriod)}</span>
          <button onClick={() => setWeekPeriod((p) => shiftWeek(p, 1))} disabled={isCurrentPeriod} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {!isCurrentPeriod && serverPeriod && (
            <button onClick={() => setWeekPeriod({ year: serverPeriod.year, week: serverPeriod.week })} className="text-[10px] font-bold text-gray-600 px-2 py-1 rounded-lg hover:bg-white transition-colors">
              Now
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setMonthPeriod((p) => shiftMonth(p, -1))} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700 px-2 min-w-[130px] text-center">{monthLabel(monthPeriod)}</span>
        <button onClick={() => setMonthPeriod((p) => shiftMonth(p, 1))} disabled={isCurrentPeriod} className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all disabled:opacity-30">
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        </button>
        {!isCurrentPeriod && serverPeriod && (
          <button onClick={() => setMonthPeriod({ year: serverPeriod.year, month: serverPeriod.month })} className="text-[10px] font-bold text-gray-600 px-2 py-1 rounded-lg hover:bg-white transition-colors">
            Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Targets</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isAdmin
              ? "Revenue & Registration targets vs achieved · all branches"
              : `Revenue & Registration targets vs achieved · ${user?.branch_name ?? "your branch"}`}
          </p>
        </div>
        {isAdmin && (
          <Btn onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Set Target
          </Btn>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {[
              { value: "revenue",       label: "Revenue",       sub: "Weekly"  },
              { value: "registrations", label: "Registrations", sub: "Monthly" },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setMetric(m.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  metric === m.value
                    ? "bg-[#1a0a0b] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {m.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                  metric === m.value ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                }`}>{m.sub}</span>
              </button>
            ))}
          </div>

          {/* Period navigator */}
          <PeriodNav />

          {/* Admin branch filter */}
          {isAdmin && (
            <SearchableSelect
              value={branchId}
              onChange={setBranchId}
              options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
              placeholder="All Branches"
              className="min-w-[160px]"
              triggerClassName="py-2"
            />
          )}

        </div>
      </div>

      {periodParams && (
        <>
          <TargetOverviewCard metric={metric} branchId={effectiveBranchId} period={periodParams} />
          <TargetBranchChart metric={metric} branchId={effectiveBranchId} period={periodParams} />
          <TargetTrend metric={metric} branchId={effectiveBranchId} />
          <TargetSummaryTable branchId={effectiveBranchId} metric={metric} period={periodParams} />
        </>
      )}

      {isAdmin && (
        <SetTargetModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={() => show("Target saved successfully")}
          branches={branches}
        />
      )}
      <Toast toast={toast} onHide={hide} />
    </div>
  );
}
