import { memo } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

// Workspace layout — Navbar only, no app sidebar.
// Used for student workspace routes so the contextual sidebar
// is the only navigation visible.
const PageContent = memo(function PageContent() {
  return <Outlet />;
});

export default function WorkspaceLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-16">
        <PageContent />
      </main>
    </div>
  );
}
