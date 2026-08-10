import { Loader2, UserX, X } from "lucide-react";
import { Btn } from "./index";

export function DeactivateConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Deactivate user",
  message = "This action cannot be undone.",
  itemName,
  isLoading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">{message}</p>
          
          {itemName && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
              <p className="text-xs font-medium text-gray-700 mb-1">User to be deactivated:</p>
              <p className="text-sm font-semibold text-red-700 break-words">{itemName}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-100">
          <Btn
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="md"
          >
            Cancel
          </Btn>
          <Btn
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            size="md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4" />
                Deactivate
              </>
            )}
          </Btn>
        </div>
      </div>
    </div>
  );
}