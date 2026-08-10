import { useState, useCallback } from "react";
import toast from "react-hot-toast";

function apiError(err) {
  if (!err) return "Action failed.";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  if (err.detail) return err.detail;
  return "Action failed.";
}

export function useAsyncAction(opts) {
  const [loading, setLoading] = useState(false);
  const onSuccess = opts?.onSuccess;

  const run = useCallback(
    async (fn, successMsg) => {
      setLoading(true);
      try {
        const result = await fn();
        if (successMsg) toast.success(successMsg);
        onSuccess?.();
        return result;
      } catch (err) {
        toast.error(apiError(err));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return { run, loading };
}
