import { describe, it, expect, vi, beforeEach } from 'vitest'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const AUTH_USER_KEY = 'authUser'

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('getAccessToken', () => {
    it('should return null when no token is stored', () => {
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    })

    it('should return token when stored', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'test-token')
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('test-token')
    })
  })

  describe('setTokens', () => {
    it('should store access token', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'test-access')
      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('test-access')
    })

    it('should store refresh token when provided', () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'test-refresh')
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('test-refresh')
    })
  })

  describe('clearTokens', () => {
    it('should remove all auth keys', () => {
      localStorage.setItem(ACCESS_TOKEN_KEY, 'test-access')
      localStorage.setItem(REFRESH_TOKEN_KEY, 'test-refresh')
      localStorage.setItem(AUTH_USER_KEY, '{"email":"test@test.com"}')

      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)

      expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
    })
  })

  describe('getStoredUser', () => {
    it('should return null when no user is stored', () => {
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
    })

    it('should return user object when stored', () => {
      const user = { email: 'test@test.com', role: 'admin' }
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      const stored = JSON.parse(localStorage.getItem(AUTH_USER_KEY)!)
      expect(stored).toEqual(user)
    })
  })
})
