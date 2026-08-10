import { createBrowserRouter } from "react-router-dom";
import DashboardLayout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminStudents from "../pages/AdminStudents";
import BranchStudents from "../pages/BranchStudents";
import Payments from "../pages/Payments";
import Attendance from "../pages/Attendance";
import Instructors from "../pages/Instructors";
import Vehicles from "../pages/Vehicles";
import Expenses from "../pages/Expenses";
import Exams from "../pages/Exams";
import Reports from "../pages/Reports";
import Settings from "../pages/Settings";
import Courses from "../pages/Courses";
import Branches from "../pages/Branches";
import UserManagement from "../pages/UserManagement";
import SessionManagement from "../pages/SessionManagement";
import Broadcast from "../pages/Broadcast";
import Targets from "../pages/Targets";
import ForgotPassword from "../pages/ForgotPassword"

const adminOnly = ["super_admin"];

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "students",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <AdminStudents />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-students",
        element: <BranchStudents />,
      },
      { path: "payments", element: <Payments /> },
      { path: "attendance", element: <Attendance /> },
      { path: "instructors", element: <Instructors /> },
      {
        path: "vehicles",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <Vehicles />
          </ProtectedRoute>
        ),
      },
      {
        path: "expenses",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <Expenses />
          </ProtectedRoute>
        ),
      },
      { path: "exams", element: <Exams /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      {
        path: "courses",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <Courses />
          </ProtectedRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <Branches />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "sessions",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <SessionManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "broadcast",
        element: (
          <ProtectedRoute allowedRoles={adminOnly}>
            <Broadcast />
          </ProtectedRoute>
        ),
      },
      { path: "targets", element: <Targets /> },
    ],
  },
]);

export default router;
