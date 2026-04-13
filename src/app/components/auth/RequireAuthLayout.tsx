import { Navigate } from 'react-router'

import { RootLayout } from '../layout/RootLayout'

function hasValidToken(): boolean {
  if (typeof window === 'undefined') return false

  const token = window.localStorage.getItem('accessToken')
  if (!token) return false

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000 // Convert to milliseconds
    if (Date.now() >= expiry) {
      // Token is expired, clean up
      window.localStorage.removeItem('accessToken')
      window.localStorage.removeItem('refreshToken')
      window.localStorage.removeItem('authUser')
      window.localStorage.removeItem('userRole')
      window.localStorage.removeItem('isAdmin')
      return false
    }
    return true
  } catch {
    // If we can't parse the token, treat it as invalid
    window.localStorage.removeItem('accessToken')
    window.localStorage.removeItem('refreshToken')
    window.localStorage.removeItem('authUser')
    window.localStorage.removeItem('userRole')
    window.localStorage.removeItem('isAdmin')
    return false
  }
}

export function RequireAuthLayout() {
  if (!hasValidToken()) {
    return <Navigate to="/auth" replace />
  }
  return <RootLayout />
}
