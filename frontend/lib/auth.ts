/**
 * Authentication utilities
 */

import { getUser, logout as apiLogout } from './api'

export function isAuthenticated(): boolean {
  return getUser() !== null
}

export function getCurrentUser() {
  return getUser()
}

export async function logout(): Promise<void> {
  await apiLogout()
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

