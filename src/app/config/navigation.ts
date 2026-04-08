import {
  BarChart3,
  Cpu,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

export const navigationItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/forecast", label: "Forecast", icon: TrendingUp },
  { path: "/rfmq", label: "Analysis", icon: Users },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/models", label: "Models", icon: Cpu },
  { path: "/admin/portal", label: "Admin Panel", icon: Settings },
];