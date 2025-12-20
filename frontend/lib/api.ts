/**
 * API client for backend communication
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Types
export interface LoginRequest {
  email: string
  role?: 'CUSTOMER' | 'PRINTER'  // Optional: if provided, validates against user's role
}

export interface SignupRequest {
  email: string
  role: 'CUSTOMER' | 'PRINTER'  // Required for signup
  company_name?: string  // Required for CUSTOMER role signup
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

// Job types
export type ProductType = 'LEAFLETS' | 'POSTERS' | 'BROCHURES' | 'FLYERS' | 'BUSINESS_CARDS' | 'OTHER'
export type JobState = 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED'

export interface PrintingJob {
  id: number
  uuid: string
  customer_profile_id: number
  product_type: string
  quantity: number
  due_date: string
  description: string | null
  special_instructions: string | null
  file_url: string | null
  bidding_duration_hours: number
  bidding_ends_at: string | null
  delivery_location: string | null
  pickup_preferred: boolean
  state: string
  created_at: string
  updated_at: string | null
  published_at: string | null
  closed_at: string | null
  completed_at: string | null
}

export interface PrintingJobCreate {
  product_type: ProductType
  quantity: number
  due_date: string
  description?: string
  special_instructions?: string
  file_url?: string
  bidding_duration_hours?: number
  delivery_location?: string
  pickup_preferred?: boolean
}

export interface PrintingJobUpdate {
  product_type?: ProductType
  quantity?: number
  due_date?: string
  description?: string
  special_instructions?: string
  file_url?: string
  bidding_duration_hours?: number
  delivery_location?: string
  pickup_preferred?: boolean
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
  } else {
    // If endpoint requires auth and no token, redirect to login
    if (endpoint.startsWith('/api/jobs') || endpoint.startsWith('/api/uploads')) {
      throw new Error('Authentication required. Please log in again.')
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      removeAuthToken()
      removeUser()
      
      // Throw error with a flag that indicates auth failure
      const error = new Error('Your session has expired. Please log in again.') as Error & { isAuthError?: boolean; status?: number }
      error.isAuthError = true
      error.status = response.status
      throw error
    }
    
    const errorText = await response.text()
    let errorMessage = `API request failed: ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.detail || errorMessage
    } catch {
      // Use default error message if parsing fails
    }
    const error = new Error(errorMessage) as Error & { status?: number }
    error.status = response.status
    throw error
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

export async function signup(request: SignupRequest): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/api/auth/signup', {
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

// Jobs API
export async function createJob(job: PrintingJobCreate): Promise<PrintingJob> {
  return apiRequest<PrintingJob>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(job),
  })
}

export async function getJob(jobUuid: string): Promise<PrintingJob> {
  return apiRequest<PrintingJob>(`/api/jobs/${jobUuid}`)
}

export async function listJobs(state?: JobState): Promise<PrintingJob[]> {
  const params = state ? `?state=${state}` : ''
  return apiRequest<PrintingJob[]>(`/api/jobs${params}`)
}

export async function updateJob(jobUuid: string, job: PrintingJobUpdate): Promise<PrintingJob> {
  return apiRequest<PrintingJob>(`/api/jobs/${jobUuid}`, {
    method: 'PUT',
    body: JSON.stringify(job),
  })
}

export async function deleteJob(jobUuid: string): Promise<void> {
  return apiRequest<void>(`/api/jobs/${jobUuid}`, {
    method: 'DELETE',
  })
}

export async function publishJob(jobUuid: string): Promise<PrintingJob> {
  return apiRequest<PrintingJob>(`/api/jobs/${jobUuid}/publish`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function getMatchingJobs(): Promise<PrintingJob[]> {
  return apiRequest<PrintingJob[]>('/api/jobs/matching')
}

// Helper function to get full file URL
// The fileUrl parameter can be either:
// - A file_key (e.g., "users/123/uuid.pdf") - will generate presigned URL
// - A presigned URL (full URL) - return as-is
// - A relative path - prepend API URL
export function getFileUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null
  
  // If it's already a full URL (starts with http:// or https://), return as-is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl
  }
  
  // If it's a relative path starting with /, prepend the API URL
  if (fileUrl.startsWith('/')) {
    return `${API_URL}${fileUrl}`
  }
  
  // Otherwise, assume it's a file_key (e.g., "users/123/uuid.pdf")
  // Construct the endpoint URL that will generate a presigned URL
  // This endpoint requires authentication, so we'll need to fetch it with auth
  return `${API_URL}/api/uploads/files/${fileUrl}`
}

// Get file download URL (direct download through backend)
export function getFileDownloadUrl(fileKey: string): string {
  // Return the backend endpoint URL - the backend will stream the file
  return `${API_URL}/api/uploads/files/${fileKey}`
}

// File upload API
export interface FileUploadResponse {
  file_path: string
  file_url: string
  filename: string
  size: number
}

export async function uploadJobFile(file: File): Promise<FileUploadResponse> {
  const token = getAuthToken()
  if (!token) {
    // Don't throw immediately - let the server handle it
    // This allows the user to see the actual server error
  }

  const formData = new FormData()
  formData.append('file', file)

  const headers: Record<string, string> = {}
  // Only add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Don't set Content-Type - browser will set it with boundary for FormData

  const response = await fetch(`${API_URL}/api/uploads/job-file`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      removeAuthToken()
      removeUser()
      
      const error = new Error('Your session has expired. Please log in again.') as Error & { isAuthError?: boolean }
      error.isAuthError = true
      throw error
    }
    
    const errorText = await response.text()
    let errorMessage = `File upload failed: ${response.statusText}`
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

