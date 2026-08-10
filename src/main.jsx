import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SidebarProvider } from "./context/SidebarContext";
import { AuthProvider } from "./context/AuthContext";
import router from "./routes/routes";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SidebarProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            success: { style: { background: "#f0fdf4", border: "1px solid #86efac", color: "#166534" } },
            error:   { style: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b" } },
          }}
        />
      </SidebarProvider>
    </AuthProvider>
  </React.StrictMode>
);
