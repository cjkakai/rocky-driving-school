import { memo } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSidebar } from "../../context/SidebarContext";

// Never reads sidebar state — charts inside Outlet won't re-render on toggle
const PageContent = memo(function PageContent() {
  return <Outlet />;
});

function MainContent() {
  return (
    <main className="pt-16 p-4 md:pl-[86px]">
      <PageContent />
    </main>
  );
}

// GPU opacity transition — never causes layout or chart resize
const Overlay = memo(function Overlay() {
  const { isCollapsed, isMobileOpen, closeMobileSidebar, collapseDesktopSidebar } = useSidebar();

  return (
    <>
      {/* Desktop: subtle overlay, click collapses sidebar */}
      <div
        onClick={collapseDesktopSidebar}
        className={`
          hidden md:block fixed inset-0 z-30 bg-black/10
          transition-opacity duration-200
          ${!isCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />
      {/* Mobile: dark overlay, click closes drawer */}
      <div
        onClick={closeMobileSidebar}
        className={`
          md:hidden fixed inset-0 z-30 bg-black/50
          transition-opacity duration-200
          ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />
    </>
  );
});

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Sidebar />
      <Overlay />
      <MainContent />
    </div>
  );
}
