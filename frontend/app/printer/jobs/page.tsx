'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMatchingJobs, type PrintingJob } from '@/lib/api'

export default function PrinterJobsPage() {
  const [jobs, setJobs] = useState<PrintingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getMatchingJobs()
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTimeRemaining = (endDate: string | null) => {
    if (!endDate) return 'N/A'
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Closed'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Available Jobs</h1>
          <p className="text-gray-600 mt-1">
            Jobs matching your profile and capabilities
          </p>
        </div>
        <button
          onClick={loadJobs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading matching jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            No matching jobs found at the moment. Make sure your printer profile is complete and matches job requirements.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.uuid}
              href={`/printer/jobs/${job.uuid}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">
                      {job.product_type.charAt(0) + job.product_type.slice(1).toLowerCase().replace('_', ' ')}
                    </h3>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      OPEN
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Quantity:</span> {job.quantity.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span> {formatDate(job.due_date)}
                    </div>
                    <div>
                      <span className="font-medium">Bidding Ends:</span> {formatDate(job.bidding_ends_at)}
                    </div>
                    <div>
                      <span className="font-medium">Time Remaining:</span>{' '}
                      <span className={job.bidding_ends_at && new Date(job.bidding_ends_at) > new Date() ? 'text-green-600 font-semibold' : 'text-red-600'}>
                        {formatTimeRemaining(job.bidding_ends_at)}
                      </span>
                    </div>
                  </div>
                  {job.description && (
                    <p className="text-gray-600 line-clamp-2 mb-2">{job.description}</p>
                  )}
                  {job.delivery_location && (
                    <p className="text-sm text-gray-500">
                      📍 {job.delivery_location} {job.pickup_preferred && '(Pickup preferred)'}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

