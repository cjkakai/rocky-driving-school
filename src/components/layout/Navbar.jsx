import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, User, ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const initials = user?.username?.slice(0, 2).toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#1a0a0b]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50 shadow-sm shadow-[#1a0a0b]/10">

      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <img src="/images.png" alt="Rocky" className="w-9 h-9 rounded-lg object-cover shadow-sm ring-2 ring-white/10" />
          <div>
            <h1 className="font-semibold text-white">Rocky Driving School</h1>
            <p className="text-xs text-white/65">Driving School Management</p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all"
          >
            <div className="w-8 h-8 bg-white text-[#1a0a0b] rounded-full flex items-center justify-center text-sm font-semibold shadow-sm">
              {initials || <User className="w-4 h-4" />}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight text-white">{user?.username}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/80 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
              <div className="sm:hidden px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              </div>

              <button
                onClick={() => { setDropdownOpen(false); navigate("/dashboard/settings"); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                Settings
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
