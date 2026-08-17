import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, BookOpen, CheckCircle, ArrowUpRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../api/dashboard.api";
import { StatsCard } from "../components/dashboard/StatsCard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { BranchPerformanceCard } from "../components/dashboard/BranchPerformanceCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { fmt } from "../utils/students.utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const TODAY = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [branchPerformance, setBranchPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrors({});
      try {
        try { setStats(await dashboardAPI.getSummaryStats()); }
        catch (err) { setErrors(p => ({ ...p, stats: err.message })); }

        try { setActivities(await dashboardAPI.getActivityFeed(8)); }
        catch (err) { setErrors(p => ({ ...p, activities: err.message })); }

        if (isSuperAdmin) {
          try { setBranchPerformance(await dashboardAPI.getBranchPerformance()); }
          catch (err) { setErrors(p => ({ ...p, performance: err.message })); }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSuperAdmin]);

  const studentsPath = isSuperAdmin ? "/dashboard/students" : "/dashboard/my-students";

  const quickActions = [
    {
      label: "Students",
      desc: "View & manage enrolments",
      icon: Users,
      path: studentsPath,
      accent: "#c41820",
      tint: "#fdf1f1",
    },
    {
      label: "Payments",
      desc: "Track collections & receipts",
      icon: DollarSign,
      path: "/dashboard/payments",
      accent: "#059669",
      tint: "#ecfdf5",
    },
    {
      label: "Exams",
      desc: "Scheduled sittings & results",
      icon: CheckCircle,
      path: "/dashboard/exams",
      accent: "#d97706",
      tint: "#fffbeb",
    },
    {
      label: "Courses",
      desc: "Manage course catalogue",
      icon: BookOpen,
      path: "/dashboard/courses",
      accent: "#b8960a",
      tint: "#fffdf0",
      adminOnly: true,
    },
  ];

  /* Derived totals for branch summary strip */
  const totalBranchStudents = branchPerformance.reduce((s, b) => s + (b.total_students ?? 0), 0);
  const totalBranchRevenue  = branchPerformance.reduce((s, b) => s + (b.total_revenue  ?? 0), 0);
  const topBranch           = branchPerformance[0];

  return (
    <div className="min-h-screen bg-[#f8f9fa]">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c41820] flex items-center justify-center shadow-md shadow-red-200 shrink-0">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {greeting()}, {user?.username || "there"} 👋
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{TODAY}</p>
            </div>
          </div>

          {/* Live pulse indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700">Live data</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Users}
            label="Students Today"
            value={stats?.total_students_today ?? "—"}
            subtext="New registrations today"
            accentColor="#c41820"
            detail={stats?.total_students_today > 0 ? `+${stats.total_students_today} enrolled today` : "No new enrolments yet"}
          />
          <StatsCard
            icon={DollarSign}
            label="Revenue Today"
            value={stats?.revenue_today ? fmt(stats.revenue_today) : "—"}
            subtext="Total payments collected"
            accentColor="#059669"
            detail={stats?.revenue_today > 0 ? `${fmt(stats.revenue_today)} received today` : "No payments yet today"}
          />
          <StatsCard
            icon={BookOpen}
            label="PDL Bookings"
            value={stats?.pdl_bookings_today ?? "—"}
            subtext="Practice sessions booked"
            accentColor="#f5c400"
            detail={stats?.pdl_bookings_today > 0 ? `${stats.pdl_bookings_today} session${stats.pdl_bookings_today !== 1 ? "s" : ""} today` : "No PDL bookings today"}
          />
          <StatsCard
            icon={CheckCircle}
            label="Exams Today"
            value={stats?.exams_today ?? "—"}
            subtext="Scheduled exam sittings"
            accentColor="#d97706"
            detail={stats?.exams_today > 0 ? `${stats.exams_today} exam${stats.exams_today !== 1 ? "s" : ""} scheduled` : "No exams scheduled today"}
          />
        </div>

        {/* ── Quick navigation ─────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Quick Navigation</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions
              .filter(a => !a.adminOnly || isSuperAdmin)
              .map(({ label, desc, icon: Icon, path, accent, tint }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="group relative bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  {/* Hover tint wash */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"
                    style={{ background: tint }}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: tint, color: accent }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <ArrowUpRight
                        className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors"
                      />
                    </div>
                    <p className="text-sm font-extrabold text-gray-900">{label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* ── Revenue chart ────────────────────────────────────────────── */}
        <RevenueChart />

        {/* ── Branch summary strip (super admin only) ──────────────────── */}
        {isSuperAdmin && branchPerformance.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4 text-[#c41820]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active Branches</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{branchPerformance.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Combined Revenue</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{fmt(totalBranchRevenue)}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Students</p>
                <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">{totalBranchStudents}</p>
                {topBranch && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Top: {topBranch.name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Branch performance + Activity feed ───────────────────────── */}
        <div className={`grid grid-cols-1 gap-5 ${isSuperAdmin ? "lg:grid-cols-2" : ""}`}>

          {/* Branch Performance */}
          {isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">Branch Performance</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Ranked by revenue · this period</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c41820] bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                  {branchPerformance.length} branches
                </span>
              </div>

              <div className="flex items-center gap-3 px-4 pb-2">
                <span className="w-5" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Branch</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Revenue</span>
                </div>
              </div>

              <div className="px-1 pb-3">
                {loading ? (
                  <div className="space-y-3 px-4 py-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : errors.performance ? (
                  <div className="flex items-center justify-center py-12 text-red-400 text-sm">{errors.performance}</div>
                ) : branchPerformance.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-400 text-sm">No branch data</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {branchPerformance.map((branch, idx) => (
                      <BranchPerformanceCard
                        key={branch.id}
                        branch={branch}
                        students={branch.total_students}
                        revenue={branch.total_revenue}
                        growth={branch.growth_percentage}
                        rank={idx + 1}
                        maxRevenue={branchPerformance[0]?.total_revenue ?? 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 tracking-tight">Recent Activity</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Latest events across all branches</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-700">Live</span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <ActivityFeed activities={activities} loading={loading} error={errors.activities} />
            </div>
          </div>

        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100">
          <p className="text-[11px] text-gray-300 font-medium">
            © {new Date().getFullYear()} Rocky Driving School. All rights reserved.
          </p>
          <p className="text-[11px] text-gray-300">Rocky Management System</p>
        </div>

      </div>
    </div>
  );
}
