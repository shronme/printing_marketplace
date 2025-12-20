'use client'

import { useState } from 'react'
import { checkHealth, API_URL } from '@/lib/api'

export default function ApiTestPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    try {
      const result = await checkHealth()
      setStatus(`✅ Success: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">API Test</h1>
        <p className="text-gray-600 mb-4">
          Test connection to backend API
        </p>
        <div className="space-y-4">
          <button
            onClick={testApi}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Backend Connection'}
          </button>
          {status && (
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {status}
            </pre>
          )}
          <div className="text-sm text-gray-500">
            <p>API URL: {API_URL}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

