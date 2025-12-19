/**
 * API client for backend communication
 * Will be implemented when backend API is ready
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }

  return response.json()
}

// Health check
export async function checkHealth() {
  return apiRequest<{ status: string; timestamp: string }>('/health')
}

