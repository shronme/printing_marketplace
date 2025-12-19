/**
 * Authentication utilities
 */

import { getUser, removeAuthToken, removeUser } from './api'

export function isAuthenticated(): boolean {
  return getUser() !== null
}

export function getCurrentUser() {
  return getUser()
}

export function logout(): void {
  removeAuthToken()
  removeUser()
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

