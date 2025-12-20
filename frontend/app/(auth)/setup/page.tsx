'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { signup, type SignupRequest } from '@/lib/api'

export default function SetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'CUSTOMER' | 'PRINTER'>('CUSTOMER')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill email from query parameter
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate company_name for CUSTOMER role
      if (role === 'CUSTOMER' && !companyName.trim()) {
        setError('Company name is required for customer signup')
        setLoading(false)
        return
      }

      // Validate email
      if (!email.trim()) {
        setError('Email is required')
        setLoading(false)
        return
      }

      const request: SignupRequest = {
        email: email.trim(),
        role,
        ...(role === 'CUSTOMER' && { company_name: companyName.trim() }),
      }

      const response = await signup(request)

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
          Create a new account. Enter your email, choose your role, and provide company information if you're a customer.
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
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as 'CUSTOMER' | 'PRINTER'
                setRole(newRole)
                // Clear company name when switching away from CUSTOMER
                if (newRole !== 'CUSTOMER') {
                  setCompanyName('')
                }
              }}
              className="form-input"
              disabled={loading}
              required
            >
              <option value="CUSTOMER">Customer</option>
              <option value="PRINTER">Printer</option>
            </select>
          </div>
          {role === 'CUSTOMER' && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="form-input"
                placeholder="Your Company Name"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Users with the same company name will be linked to the same customer profile.
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
            disabled={loading || !email.trim() || (role === 'CUSTOMER' && !companyName.trim())}
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

