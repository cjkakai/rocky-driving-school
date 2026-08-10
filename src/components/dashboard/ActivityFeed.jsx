import { formatDistanceToNow } from "date-fns";
import {
  GraduationCap,
  DollarSign,
  BookOpen,
  CheckCircle,
} from "lucide-react";

const ACTIVITY_TYPES = {
  student_registered: {
    icon: GraduationCap,
    label: "Registered",
    color:
      "bg-blue-100 text-blue-700 border border-blue-200",
  },

  payment_received: {
    icon: DollarSign,
    label: "Payment",
    color:
      "bg-green-100 text-green-700 border border-green-200",
  },

  pdl_booked: {
    icon: BookOpen,
    label: "PDL",
    color:
      "bg-purple-100 text-purple-700 border border-purple-200",
  },

  exam_scheduled: {
    icon: CheckCircle,
    label: "Exam",
    color:
      "bg-orange-100 text-orange-700 border border-orange-200",
  },
};

export function ActivityFeed({
  activities,
  loading,
  error,
}) {
  if (loading)
    return (
      <div className="h-[320px] flex items-center justify-center text-gray-400 text-sm">
        Loading activities...
      </div>
    );

  if (error)
    return (
      <div className="h-[320px] flex items-center justify-center text-red-400 text-sm">
        {error}
      </div>
    );

  if (!activities?.length)
    return (
      <div className="h-[320px] flex items-center justify-center text-gray-400 text-sm">
        No recent activities
      </div>
    );

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const config =
          ACTIVITY_TYPES[activity.type] ??
          ACTIVITY_TYPES.student_registered;

        const Icon = config.icon;

        return (
          <div
            key={idx}
            className="group relative flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5"
          >
            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-gray-900 truncate">{activity.student_name}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{activity.description}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}