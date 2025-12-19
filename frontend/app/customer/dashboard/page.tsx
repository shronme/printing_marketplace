'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listJobs, type PrintingJob } from '@/lib/api'

export default function CustomerDashboard() {
  const [stats, setStats] = useState({
    active: 0,
    draft: 0,
    completed: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const allJobs = await listJobs()
      setStats({
        active: allJobs.filter(j => j.state === 'OPEN' || j.state === 'IN_PROGRESS').length,
        draft: allJobs.filter(j => j.state === 'DRAFT').length,
        completed: allJobs.filter(j => j.state === 'COMPLETED').length,
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Customer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Active Jobs</h2>
          <p className="text-3xl font-bold">{loading ? '...' : stats.active}</p>
          <p className="text-sm text-gray-500 mt-1">Open or in progress</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Draft Jobs</h2>
          <p className="text-3xl font-bold">{loading ? '...' : stats.draft}</p>
          <p className="text-sm text-gray-500 mt-1">Not yet published</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Completed</h2>
          <p className="text-3xl font-bold">{loading ? '...' : stats.completed}</p>
          <p className="text-sm text-gray-500 mt-1">Finished jobs</p>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <Link
          href="/customer/jobs/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block"
        >
          Create New Job
        </Link>
        <Link
          href="/customer/jobs"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition inline-block"
        >
          View All Jobs
        </Link>
      </div>
    </div>
  )
}

