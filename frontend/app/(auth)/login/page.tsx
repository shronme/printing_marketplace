'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, type LoginRequest } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'PRINTER' | ''>('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate company_name for CUSTOMER role signup
      if (role === 'CUSTOMER' && !companyName.trim()) {
        setError('Company name is required for customer signup')
        setLoading(false)
        return
      }

      const request: LoginRequest = {
        email: email.trim(),
        ...(role && { role: role as 'CUSTOMER' | 'PRINTER' }),
        ...(role === 'CUSTOMER' && companyName.trim() && { company_name: companyName.trim() }),
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
              className="form-input"
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
              onChange={(e) => {
                const newRole = e.target.value as 'CUSTOMER' | 'PRINTER' | ''
                setRole(newRole)
                // Clear company name when switching away from CUSTOMER
                if (newRole !== 'CUSTOMER') {
                  setCompanyName('')
                }
              }}
              className="form-input"
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
          {role === 'CUSTOMER' && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                Company Name <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-500 ml-1">(for new signups)</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="form-input"
                placeholder="Your Company Name"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for new customer signups. Users with the same company name will be linked to the same customer profile.
              </p>
            </div>
          )}
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

