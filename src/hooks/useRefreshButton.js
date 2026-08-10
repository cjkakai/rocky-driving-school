import { useState, useCallback } from "react";

// states: "idle" | "loading" | "done"
export function useRefreshButton(onRefresh) {
  const [state, setState] = useState("idle");

  const trigger = useCallback(async () => {
    if (state !== "idle") return;
    setState("loading");
    await Promise.all([onRefresh(), new Promise((r) => setTimeout(r, 600))]);
    setState("done");
    setTimeout(() => setState("idle"), 800);
  }, [state, onRefresh]);

  return { refreshState: state, triggerRefresh: trigger };
}
