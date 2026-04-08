import { Navigate } from "react-router";
import { RootLayout } from "../layout/RootLayout";

function hasToken() {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem("accessToken");
}

export function RequireAuthLayout() {
  if (!hasToken()) {
    return <Navigate to="/auth" replace />;
  }
  return <RootLayout />;
}
