import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "../api/auth.api";

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MINUTES =
  Number(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES) || 15;
const IDLE_TIMEOUT = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const WARNING_BEFORE = 60 * 1000; // show warning in the last 60 seconds
const TICK_INTERVAL = 1000;
const ACTIVITY_KEY = "last_activity";
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // null = no warning; number = seconds remaining before logout
  const [warningRemaining, setWarningRemaining] = useState(null);

  useEffect(() => {
    if (user) localStorage.setItem("auth_user", JSON.stringify(user));
    else localStorage.removeItem("auth_user");
  }, [user]);

  const recordActivity = useCallback(() => {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  }, []);

  const handleIdleLogout = useCallback(async () => {
    toast.error("Logged out due to inactivity");
    await authAPI.logout();
    setUser(null);
    setWarningRemaining(null);
    localStorage.removeItem(ACTIVITY_KEY);
  }, []);

  // Activity listeners — paused in this tab while the warning is open,
  // so only an explicit "Stay signed in" click (or activity in ANOTHER tab) dismisses it.
  useEffect(() => {
    if (!user || warningRemaining !== null) return;

    recordActivity();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, recordActivity, { passive: true })
    );
    return () => {
      ACTIVITY_EVENTS.forEach((e) =>
        window.removeEventListener(e, recordActivity)
      );
    };
  }, [user, warningRemaining, recordActivity]);

  // Polling tick — single source of truth for warning/logout decisions.
  // Reads from localStorage, so any tab's activity updates affect every tab.
  useEffect(() => {
    if (!user) return;

    const tick = () => {
      const stored = localStorage.getItem(ACTIVITY_KEY);
      const last = stored ? Number(stored) : Date.now();
      const remaining = IDLE_TIMEOUT - (Date.now() - last);

      if (remaining <= 0) {
        handleIdleLogout();
      } else if (remaining <= WARNING_BEFORE) {
        setWarningRemaining(Math.ceil(remaining / 1000));
      } else {
        setWarningRemaining(null);
      }
    };

    tick();
    const interval = setInterval(tick, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [user, handleIdleLogout]);

  const login = async (email, password) => {
    const u = await authAPI.login(email, password);
    if (!u) return false;
    setUser(u);
    recordActivity();
    return true;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setWarningRemaining(null);
    localStorage.removeItem(ACTIVITY_KEY);
  };

  const extendSession = () => {
    recordActivity();
    setWarningRemaining(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
      {warningRemaining !== null && (
        <IdleWarningModal
          remaining={warningRemaining}
          onStay={extendSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

function IdleWarningModal({ remaining, onStay, onLogout }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900 text-lg">
              Are you still there?
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              You'll be signed out in{" "}
              <span className="font-semibold text-gray-900 tabular-nums">
                {remaining}
              </span>{" "}
              {remaining === 1 ? "second" : "seconds"} due to inactivity.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onLogout}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Log out now
          </button>
          <button
            onClick={onStay}
            className="flex-1 rounded-xl bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary/90 transition"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
