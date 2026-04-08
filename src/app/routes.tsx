import { createBrowserRouter } from "react-router";
import { RequireAuthLayout } from "./components/auth/RequireAuthLayout";
import { AuthPage } from "./pages/AuthPage";
import { LandingPage } from "./pages/LandingPage";
import { appRouteConfigs } from "./config/appRoutes";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/auth", Component: AuthPage },
  {
    path: "/",
    Component: RequireAuthLayout,
    children: [
      ...appRouteConfigs.map(({ path, Component }) => ({ path, Component })),
    ],
  },
]);