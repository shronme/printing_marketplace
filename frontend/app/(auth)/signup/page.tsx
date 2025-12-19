'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { login, type LoginRequest } from '@/lib/api'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'PRINTER'>('CUSTOMER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const request: LoginRequest = {
        email: email.trim(),
        role,
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
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
        <p className="text-gray-600 mb-4">
          Create a new account. Just enter your email and choose your role.
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as 'CUSTOMER' | 'PRINTER'
                setRole(newRole)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
              disabled={loading}
              required
            >
              <option value="CUSTOMER">Customer</option>
              <option value="PRINTER">Printer</option>
            </select>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 underline">
              Login here
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}

