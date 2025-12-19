'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, type LoginRequest } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'PRINTER' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const request: LoginRequest = {
        email: email.trim(),
        ...(role && { role: role as 'CUSTOMER' | 'PRINTER' }),
      }

      const response = await login(request)

      // Redirect based on user role
      if (response.user.role === 'CUSTOMER') {
        router.push('/customer/dashboard')
      } else if (response.user.role === 'PRINTER') {
        router.push('/printer/dashboard')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <p className="text-gray-600 mb-4">
          Enter your email to login. If you don't have an account, one will be created for you.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role (Optional)
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'CUSTOMER' | 'PRINTER' | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select role (defaults to Customer)</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PRINTER">Printer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If not specified, defaults to Customer. Existing users keep their current role.
            </p>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:text-blue-700 underline">
              Sign up here
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

