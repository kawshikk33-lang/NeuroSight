import { createBrowserRouter } from 'react-router'

import { AdminOnlyRoute } from './components/auth/AdminOnlyRoute'
import { RequireAuthLayout } from './components/auth/RequireAuthLayout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { AdminPage } from './pages/AdminPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { DataConnectorsPage } from './pages/DataConnectorsPage'
import { ForecastPage } from './pages/ForecastPage'
import { LandingPage } from './pages/LandingPage'
import { ModelsPage } from './pages/ModelsPage'
import { RFMQPage } from './pages/RFMQPage'
import { SettingsPage } from './pages/SettingsPage'

// Wrap each route with ErrorBoundary
const eb = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
)

export const router = createBrowserRouter([
  { path: '/', element: eb(LandingPage) },
  { path: '/auth', element: eb(AuthPage) },
  {
    path: '/',
    element: eb(RequireAuthLayout),
    children: [
      { path: 'dashboard', element: eb(DashboardPage) },
      { path: 'forecast', element: eb(ForecastPage) },
      { path: 'rfmq', element: eb(RFMQPage) },
      { path: 'analytics', element: eb(AnalyticsPage) },
      { path: 'models', element: eb(ModelsPage) },
      { path: 'connectors', element: eb(DataConnectorsPage) },
      { path: 'settings', element: eb(SettingsPage) },
      {
        path: 'admin/portal',
        element: eb(() => (
          <AdminOnlyRoute>
            <AdminPage />
          </AdminOnlyRoute>
        )),
      },
    ],
  },
])
