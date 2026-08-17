import { formatDistanceToNow } from "date-fns";
import { GraduationCap, DollarSign, BookOpen, CheckCircle } from "lucide-react";

const ACTIVITY_TYPES = {
  student_registered: { icon: GraduationCap, color: "#c41820",  tint: "#fdf1f1",  label: "Registered" },
  payment_received:   { icon: DollarSign,    color: "#059669",  tint: "#ecfdf5",  label: "Payment"    },
  pdl_booked:         { icon: BookOpen,      color: "#b8960a",  tint: "#fffdf0",  label: "PDL"        },
  exam_scheduled:     { icon: CheckCircle,   color: "#d97706",  tint: "#fffbeb",  label: "Exam"       },
};

function ActivityItem({ activity, isLast }) {
  const cfg = ACTIVITY_TYPES[activity.type] ?? ACTIVITY_TYPES.student_registered;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10"
          style={{ background: cfg.tint, color: cfg.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
      </div>

      <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{activity.student_name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{activity.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.tint, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <p className="text-[10px] text-gray-300 mt-1 whitespace-nowrap">
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ activities, loading, error }) {
  if (loading)
    return <div className="py-12 flex items-center justify-center text-gray-400 text-sm">Loading activities...</div>;

  if (error)
    return <div className="py-12 flex items-center justify-center text-red-400 text-sm">{error}</div>;

  if (!activities?.length)
    return <div className="py-12 flex items-center justify-center text-gray-400 text-sm">No recent activities</div>;

  return (
    <div>
      {activities.map((activity, idx) => (
        <ActivityItem key={idx} activity={activity} isLast={idx === activities.length - 1} />
      ))}
    </div>
  );
}
