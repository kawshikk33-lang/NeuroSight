import { render } from '@testing-library/react'
import { Navigate } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { RequireAuthLayout } from '../auth/RequireAuthLayout'

vi.mock('react-router', () => ({
  Navigate: vi.fn(() => null),
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
  Outlet: () => null,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../layout/RootLayout', () => ({
  RootLayout: () => null,
}))

describe('RequireAuthLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should redirect to /auth when no token is present', () => {
    render(<RequireAuthLayout />)
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/auth', replace: true }),
      expect.anything()
    )
  })

  it('should render RootLayout when valid token is present', () => {
    // Create a non-expired token (exp in 1 hour)
    const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })
    const fakeToken = `header.${btoa(payload)}.signature`
    localStorage.setItem('accessToken', fakeToken)

    render(<RequireAuthLayout />)
    expect(Navigate).not.toHaveBeenCalled()
  })

  it('should redirect to /auth when token is expired', () => {
    // Create an expired token (exp in the past)
    const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })
    const fakeToken = `header.${btoa(payload)}.signature`
    localStorage.setItem('accessToken', fakeToken)

    render(<RequireAuthLayout />)
    expect(Navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/auth', replace: true }),
      expect.anything()
    )
    // Should also clean up expired token
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})
