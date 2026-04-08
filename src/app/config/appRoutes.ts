import {
  BarChart3,
  Cpu,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { DashboardPage } from "../pages/DashboardPage";
import { ForecastPage } from "../pages/ForecastPage";
import { RFMQPage } from "../pages/RFMQPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { ModelsPage } from "../pages/ModelsPage";
import { AdminOnlyRoute } from "../components/auth/AdminOnlyRoute";

export type AppRouteConfig = {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  Component: ComponentType;
  adminOnly?: boolean;
};

export const appRouteConfigs: AppRouteConfig[] = [
  {
    path: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    Component: DashboardPage,
  },
  {
    path: "forecast",
    label: "Forecast",
    icon: TrendingUp,
    Component: ForecastPage,
  },
  {
    path: "rfmq",
    label: "Analysis",
    icon: Users,
    Component: RFMQPage,
  },
  {
    path: "analytics",
    label: "Analytics",
    icon: BarChart3,
    Component: AnalyticsPage,
  },
  {
    path: "models",
    label: "Models",
    icon: Cpu,
    Component: ModelsPage,
  },
  {
    path: "admin/portal",
    label: "Admin Panel",
    icon: Settings,
    Component: AdminOnlyRoute,
    adminOnly: true,
  },
];

export const sidebarRouteConfigs = appRouteConfigs;