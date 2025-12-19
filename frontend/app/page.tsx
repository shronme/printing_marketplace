'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, type LoginRequest } from '@/lib/api'

export default function Home() {
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
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-8">
          Printing Marketplace
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Connect customers with printers for your printing needs
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
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                const newRole = e.target.value as 'CUSTOMER' | 'PRINTER'
                setRole(newRole)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Getting in...' : 'Get In'}
          </button>
        </form>
      </div>
    </main>
  )
}

