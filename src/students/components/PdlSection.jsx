import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { canBookPdl, pdlBlockedReason } from "../../utils/studentActions";

export function PdlSection({ sc, isBranchUser, isSuperAdmin, loading, onBookPdl, onApprovePdl }) {
  const pdlReason     = pdlBlockedReason(sc);
  const eligibleForPdl = isBranchUser && canBookPdl(sc);

  if (sc.is_refresher_course) {
    return <span className="text-xs text-gray-400 italic">Not required (refresher)</span>;
  }

  if (sc.status === "pending_pdl" && sc.pdl_state === "none" && isBranchUser) {
    return (
      <div className="space-y-1.5">
        {eligibleForPdl ? (
          <button
            onClick={onBookPdl}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" /> Submit for PDL Approval
          </button>
        ) : (
          <p className="text-xs text-red-400 italic">{pdlReason}</p>
        )}
      </div>
    );
  }

  if (sc.pdl_state === "pending") {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Pending Approval
        </span>
        {isSuperAdmin && (
          <div>
            <button
              onClick={onApprovePdl}
              disabled={loading}
              className="flex items-center gap-1 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          </div>
        )}
      </div>
    );
  }

  if (sc.pdl_state === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    );
  }

  if (sc.pdl_state === "expired") {
    return (
      <div className="space-y-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <XCircle className="w-3 h-3" /> Expired
        </span>
        {isBranchUser && (
          eligibleForPdl ? (
            <div>
              <button
                onClick={onBookPdl}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-bold bg-[#1a0a0b] hover:bg-[#2d1214] text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Calendar className="w-3.5 h-3.5" /> Renew PDL
              </button>
            </div>
          ) : (
            <p className="text-xs text-red-400 italic">{pdlReason}</p>
          )
        )}
      </div>
    );
  }

  return null;
}
