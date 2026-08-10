import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  const collapseDesktopSidebar = useCallback(() => setIsCollapsed(true), []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMobileOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMobileOpen]);

  const value = useMemo(
    () => ({ isCollapsed, isMobileOpen, toggleSidebar, closeMobileSidebar, collapseDesktopSidebar }),
    [isCollapsed, isMobileOpen, toggleSidebar, closeMobileSidebar, collapseDesktopSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
