import { Navigate } from "react-router";
import { AdminPage } from "../../pages/AdminPage";
import { apiClient } from "../../services/api/client";

function isAdminUser() {
  if (typeof window === "undefined") {
    return false;
  }

  const role = apiClient.getStoredUser()?.role ?? window.localStorage.getItem("userRole");
  const token = window.localStorage.getItem("accessToken");
  return !!token && role === "admin";
}

export function AdminOnlyRoute() {
  if (!isAdminUser()) {
    return <Navigate to="/" replace />;
  }

  return <AdminPage />;
}
