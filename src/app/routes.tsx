import { createBrowserRouter } from 'react-router'

import { RequireAuthLayout } from './components/auth/RequireAuthLayout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { appRouteConfigs } from './config/appRoutes'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'

// Wrap each route with ErrorBoundary
const createErrorBoundRoute = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
)

export const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/auth', Component: AuthPage },
  {
    path: '/',
    Component: RequireAuthLayout,
    children: [
      ...appRouteConfigs.map(({ path, Component }) => ({
        path,
        element: createErrorBoundRoute(Component),
      })),
    ],
  },
])
