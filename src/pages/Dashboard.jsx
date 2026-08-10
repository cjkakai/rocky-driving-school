import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, BookOpen, CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashboardAPI } from "../api/dashboard.api";
import { StatsCard } from "../components/dashboard/StatsCard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { BranchPerformanceCard } from "../components/dashboard/BranchPerformanceCard";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { fmt } from "../utils/students.utils";

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

        try { setActivities(await dashboardAPI.getActivityFeed(5)); }
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

  // Navigation: branch users go to /my-students, admins to /students
  const studentsPath = isSuperAdmin ? "/dashboard/students" : "/dashboard/my-students";

  const quickActions = [
    { label: "Students", icon: Users,        path: studentsPath,          color: "blue" },
    { label: "Payments", icon: DollarSign,   path: "/dashboard/payments", color: "green" },
    { label: "Exams",    icon: CheckCircle,  path: "/dashboard/exams",    color: "red" },
    { label: "Courses",  icon: BookOpen,     path: "/dashboard/courses",  color: "yellow", adminOnly: true },
  ];

  const colorMap = {
    blue:   { border: "hover:border-blue-300 hover:bg-blue-50",   icon: "text-blue-600",   text: "group-hover:text-blue-700",   arrow: "group-hover:text-blue-400" },
    green:  { border: "hover:border-green-300 hover:bg-green-50", icon: "text-green-600",  text: "group-hover:text-green-700",  arrow: "group-hover:text-green-400" },
    red:    { border: "hover:border-red-300 hover:bg-red-50",     icon: "text-red-600",    text: "group-hover:text-red-700",    arrow: "group-hover:text-red-400" },
    yellow: { border: "hover:border-yellow-300 hover:bg-yellow-50", icon: "text-yellow-600", text: "group-hover:text-yellow-700", arrow: "group-hover:text-yellow-400" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 to-slate-100 p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.username || "User"}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users}       label="Students Today"  value={stats?.total_students_today ?? "—"} subtext="New registrations" gradient="from-blue-600 to-blue-700" />
        <StatsCard icon={DollarSign}  label="Revenue Today"   value={stats?.revenue_today ? fmt(stats.revenue_today) : "—"} subtext="Total collected" gradient="from-green-600 to-green-700" />
        <StatsCard icon={BookOpen}    label="PDL Bookings"    value={stats?.pdl_bookings_today ?? "—"} subtext="Practice sessions" gradient="from-amber-500 to-amber-600" />
        <StatsCard icon={CheckCircle} label="Exams Today"     value={stats?.exams_today ?? "—"} subtext="Scheduled exams" gradient="from-rose-600 to-rose-700" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Navigation</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions
            .filter(a => !a.adminOnly || isSuperAdmin)
            .map(({ label, icon: Icon, path, color }) => {
              const c = colorMap[color];
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 ${c.border} transition-all group`}
                >
                  <Icon className={`w-4 h-4 ${c.icon}`} />
                  <span className={`text-sm font-medium text-gray-800 ${c.text}`}>{label}</span>
                  <ArrowRight className={`w-3.5 h-3.5 text-gray-300 ${c.arrow} ml-1`} />
                </button>
              );
            })}
        </div>
      </div>

      {/* Revenue Chart — full width */}
      <RevenueChart />

      {/* Branch Performance + Activity Feed — equal height 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        {/* Branch Performance (admin only) */}
        {isSuperAdmin ? (
          <div className="bg-gray-50/70 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="relative px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Branch Performance</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ranked by revenue</p>
              <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-t-xl" />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
              ) : errors.performance ? (
                <div className="flex items-center justify-center h-full text-red-400 text-sm">{errors.performance}</div>
              ) : branchPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No branch data</div>
              ) : (
                <div className="space-y-1">
                  {branchPerformance.map((branch, idx) => (
                    <BranchPerformanceCard
                      key={branch.id}
                      branch={branch}
                      students={branch.total_students}
                      revenue={branch.total_revenue}
                      growth={branch.growth_percentage}
                      rank={idx + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-admin: show a placeholder so activity feed still has a peer */
          <div className="hidden lg:block" />
        )}

        {/* Activity Feed */}
        <div className={`bg-white/90 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full ${!isSuperAdmin ? "lg:col-span-2" : ""}`}>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest 5 events</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col">
            <ActivityFeed activities={activities} loading={loading} error={errors.activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
