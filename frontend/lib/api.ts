/**
 * API client for backend communication
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Types
export interface LoginRequest {
  email: string
  role?: 'CUSTOMER' | 'PRINTER'
}

export interface User {
  id: number
  uuid: string
  email: string
  role: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// Get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Set auth token in localStorage
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

// Remove auth token from localStorage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

// Get user data from localStorage
export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// Set user data in localStorage
export function setUser(user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('user', JSON.stringify(user))
}

// Remove user data from localStorage
export function removeUser(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user')
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `API request failed: ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      // Use default error message if parsing fails
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// Health check
export async function checkHealth() {
  return apiRequest<{ status: string; timestamp: string }>('/health')
}

// Authentication API
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
  
  // Store token and user data
  setAuthToken(response.access_token)
  setUser(response.user)
  
  return response
}

// Logout API call and clear local storage
export async function logout(): Promise<void> {
  try {
    // Call backend logout endpoint if we have a token
    const token = getAuthToken()
    if (token) {
      await apiRequest<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      })
    }
  } catch (error) {
    // Even if the API call fails, we should still clear local storage
    console.error('Logout API call failed:', error)
  } finally {
    // Always clear local storage regardless of API call result
    removeAuthToken()
    removeUser()
  }
}

