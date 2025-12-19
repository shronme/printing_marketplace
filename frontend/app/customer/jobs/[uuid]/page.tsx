'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  getJob, 
  updateJob, 
  deleteJob, 
  publishJob,
  uploadJobFile,
  getFileDownloadUrl,
  type PrintingJob, 
  type PrintingJobUpdate,
  type ProductType 
} from '@/lib/api'

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobUuid = params.uuid as string

  const [job, setJob] = useState<PrintingJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<PrintingJobUpdate>({})

  useEffect(() => {
    if (jobUuid) {
      loadJob()
    }
  }, [jobUuid])

  const loadJob = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getJob(jobUuid)
      setJob(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job) return

    try {
      setSaving(true)
      setError('')
      const updated = await updateJob(jobUuid, formData)
      setJob(updated)
      setIsEditing(false)
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!job || !confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      await deleteJob(jobUuid)
      router.push('/customer/jobs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job')
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!job || !confirm('Publish this job? It will become visible to printers and you won\'t be able to edit it.')) {
      return
    }

    try {
      setSaving(true)
      setError('')
      const published = await publishJob(jobUuid)
      setJob(published)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish job')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      return
    }

    try {
      setUploading(true)
      setError('')
      const result = await uploadJobFile(file)
      setUploadedFile({ name: file.name, url: result.file_url })
      setFormData({ ...formData, file_url: result.file_url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setFormData({ ...formData, file_url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startEditing = () => {
    if (!job) return
    setIsEditing(true)
    setUploadedFile(job.file_url ? { name: 'Current file', url: job.file_url } : null)
    setFormData({
      product_type: job.product_type as ProductType,
      quantity: job.quantity,
      due_date: job.due_date ? new Date(job.due_date).toISOString().slice(0, 10) : undefined,
      description: job.description || undefined,
      special_instructions: job.special_instructions || undefined,
      file_url: job.file_url || undefined,
      bidding_duration_hours: job.bidding_duration_hours,
      delivery_location: job.delivery_location || undefined,
      pickup_preferred: job.pickup_preferred,
    })
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading job...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Job not found
        </div>
        <Link href="/customer/jobs" className="mt-4 text-blue-600 hover:underline">
          ← Back to Jobs
        </Link>
      </div>
    )
  }

  const productTypes: ProductType[] = ['LEAFLETS', 'POSTERS', 'BROCHURES', 'FLYERS', 'BUSINESS_CARDS', 'OTHER']
  const canEdit = job.state === 'DRAFT'
  const canPublish = job.state === 'DRAFT'
  const canDelete = job.state === 'DRAFT'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/customer/jobs" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Jobs
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {job.product_type.charAt(0) + job.product_type.slice(1).toLowerCase().replace('_', ' ')}
            </h1>
            <span className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${getStateColor(job.state)}`}>
              {job.state}
            </span>
          </div>
          {canEdit && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={startEditing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit
              </button>
              {canPublish && (
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdate} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label htmlFor="product_type" className="block text-sm font-medium mb-2">
              Product Type
            </label>
            <select
              id="product_type"
              value={formData.product_type || job.product_type}
              onChange={(e) => setFormData({ ...formData, product_type: e.target.value as ProductType })}
              className="form-select"
              disabled={saving}
            >
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-2">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity ?? job.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              className="form-select"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium mb-2">
              Due Date
            </label>
            <input
              id="due_date"
              type="date"
              value={formData.due_date || (job.due_date ? new Date(job.due_date).toISOString().slice(0, 10) : '')}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="form-input"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="bidding_duration_hours" className="block text-sm font-medium mb-2">
              Bidding Duration (hours)
            </label>
            <input
              id="bidding_duration_hours"
              type="number"
              min="1"
              value={formData.bidding_duration_hours ?? job.bidding_duration_hours}
              onChange={(e) => setFormData({ ...formData, bidding_duration_hours: Number(e.target.value) })}
              className="form-select"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description ?? job.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="special_instructions" className="block text-sm font-medium mb-2">
              Special Instructions
            </label>
            <textarea
              id="special_instructions"
              rows={3}
              value={formData.special_instructions ?? job.special_instructions ?? ''}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              className="form-textarea"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="delivery_location" className="block text-sm font-medium mb-2">
              Delivery Location
            </label>
            <input
              id="delivery_location"
              type="text"
              value={formData.delivery_location ?? job.delivery_location ?? ''}
              onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              className="form-select"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="file_upload" className="block text-sm font-medium mb-2">
              Design File
            </label>
            {!uploadedFile ? (
              <div>
                <input
                  ref={fileInputRef}
                  id="file_upload"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={saving || uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.tif,.psd,.ai,.eps,.svg,.doc,.docx,.zip"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your design file (PDF, images, or design files). Maximum size: 50MB
                </p>
                {uploading && (
                  <p className="text-sm text-blue-600 mt-2">Uploading file...</p>
                )}
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={saving}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="pickup_preferred"
              type="checkbox"
              checked={formData.pickup_preferred ?? job.pickup_preferred}
              onChange={(e) => setFormData({ ...formData, pickup_preferred: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={saving}
            />
            <label htmlFor="pickup_preferred" className="ml-2 block text-sm text-gray-900">
              Pickup preferred
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setFormData({})
              }}
              disabled={saving}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
              <p className="text-lg font-semibold">{job.quantity.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
              <p className="text-lg font-semibold">{formatDate(job.due_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bidding Duration</h3>
              <p className="text-lg font-semibold">{job.bidding_duration_hours} hours</p>
            </div>
            {job.bidding_ends_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bidding Ends</h3>
                <p className="text-lg font-semibold">{formatDate(job.bidding_ends_at)}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Delivery Location</h3>
              <p className="text-lg font-semibold">{job.delivery_location || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pickup Preferred</h3>
              <p className="text-lg font-semibold">{job.pickup_preferred ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {job.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.special_instructions && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Special Instructions</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{job.special_instructions}</p>
            </div>
          )}

          {job.file_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Design File</h3>
              <a
                href={getFileDownloadUrl(job.file_url)}
                download
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                onClick={async (e) => {
                  // Add authentication header to the download
                  const token = localStorage.getItem('auth_token')
                  if (token && job.file_url) {
                    e.preventDefault()
                    try {
                      const response = await fetch(getFileDownloadUrl(job.file_url), {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })
                      
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = job.file_url.split('/').pop() || 'file'
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      } else {
                        setError('Failed to download file')
                      }
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to download file')
                    }
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download Design File</span>
              </a>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span> {formatDate(job.created_at)}
              </div>
              {job.updated_at && (
                <div>
                  <span className="text-gray-500">Updated:</span> {formatDate(job.updated_at)}
                </div>
              )}
              {job.published_at && (
                <div>
                  <span className="text-gray-500">Published:</span> {formatDate(job.published_at)}
                </div>
              )}
              {job.closed_at && (
                <div>
                  <span className="text-gray-500">Closed:</span> {formatDate(job.closed_at)}
                </div>
              )}
              {job.completed_at && (
                <div>
                  <span className="text-gray-500">Completed:</span> {formatDate(job.completed_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

