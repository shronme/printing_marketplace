'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listJobs, type PrintingJob, type JobState } from '@/lib/api'

export default function CustomerJobsPage() {
  const [jobs, setJobs] = useState<PrintingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<JobState | 'ALL'>('ALL')

  useEffect(() => {
    loadJobs()
  }, [filter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const state = filter === 'ALL' ? undefined : filter
      const data = await listJobs(state)
      setJobs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'OPEN':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <Link
          href="/customer/jobs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Job
        </Link>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          {(['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'IN_PROGRESS', 'COMPLETED'] as const).map((state) => (
            <button
              key={state}
              onClick={() => setFilter(state)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === state
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            {filter === 'ALL' 
              ? 'No jobs found. Create your first job to get started!'
              : `No ${filter.toLowerCase()} jobs found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.uuid}
              href={`/customer/jobs/${job.uuid}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">
                      {job.product_type.charAt(0) + job.product_type.slice(1).toLowerCase().replace('_', ' ')}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(job.state)}`}>
                      {job.state}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Quantity:</span> {job.quantity.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span> {formatDate(job.due_date)}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {formatDate(job.created_at)}
                    </div>
                    {job.published_at && (
                      <div>
                        <span className="font-medium">Published:</span> {formatDate(job.published_at)}
                      </div>
                    )}
                  </div>
                  {job.description && (
                    <p className="mt-2 text-gray-600 line-clamp-2">{job.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

