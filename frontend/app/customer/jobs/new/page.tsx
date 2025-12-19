'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { createJob, uploadJobFile, type PrintingJobCreate, type ProductType } from '@/lib/api'

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Note: Authentication is checked by the API - if token is invalid, user will see error and be redirected
  
  const [formData, setFormData] = useState<PrintingJobCreate>({
    product_type: 'LEAFLETS',
    quantity: 100,
    due_date: '',
    description: '',
    special_instructions: '',
    file_url: '',
    bidding_duration_hours: 24,
    delivery_location: '',
    pickup_preferred: false,
  })

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
      setUploadSuccess(false)
      const result = await uploadJobFile(file)
      setUploadedFile({ name: file.name, url: result.file_url })
      setFormData({ ...formData, file_url: result.file_url })
      setUploadSuccess(true)
    } catch (err) {
      const error = err as Error & { isAuthError?: boolean }
      setError(error.message || 'Failed to upload file')
      setUploadSuccess(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Only redirect to login if it's explicitly an authentication error
      // Don't redirect for other errors (network, file size, etc.)
      if (error.isAuthError && error.message.includes('session has expired')) {
        setTimeout(() => {
          router.push('/login')
        }, 3000) // Give user more time to see the error message
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadSuccess(false)
    setFormData({ ...formData, file_url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate due date is in the future
      if (formData.due_date) {
        const dueDate = new Date(formData.due_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
        if (dueDate <= today) {
          setError('Due date must be in the future')
          setLoading(false)
          return
        }
      }

      const job = await createJob({
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : '',
        quantity: Number(formData.quantity),
        bidding_duration_hours: formData.bidding_duration_hours || 24,
      })

      router.push(`/customer/jobs/${job.uuid}`)
    } catch (err) {
      const error = err as Error & { isAuthError?: boolean }
      setError(error.message || 'Failed to create job. Please try again.')
      
      // Redirect to login only if it's an authentication error
      if (error.isAuthError) {
        setTimeout(() => {
          router.push('/login')
        }, 2000) // Give user time to see the error message
      }
    } finally {
      setLoading(false)
    }
  }

  const productTypes: ProductType[] = ['LEAFLETS', 'POSTERS', 'BROCHURES', 'FLYERS', 'BUSINESS_CARDS', 'OTHER']

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Job</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="product_type" className="block text-sm font-medium text-gray-700 mb-2">
            Product Type<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            id="product_type"
            required
            value={formData.product_type}
            onChange={(e) => setFormData({ ...formData, product_type: e.target.value as ProductType })}
            className="form-select"
            disabled={loading}
          >
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            className="form-input"
            placeholder="100"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
            Due Date<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="due_date"
            type="date"
            required
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="bidding_duration_hours" className="block text-sm font-medium text-gray-700 mb-2">
            Bidding Duration (hours)<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            id="bidding_duration_hours"
            type="number"
            required
            min="1"
            value={formData.bidding_duration_hours}
            onChange={(e) => setFormData({ ...formData, bidding_duration_hours: Number(e.target.value) })}
            className="form-input"
            placeholder="24"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">How long printers have to submit bids</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-textarea"
            placeholder="Describe your printing job requirements..."
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions
          </label>
          <textarea
            id="special_instructions"
            rows={3}
            value={formData.special_instructions}
            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
            className="form-textarea"
            placeholder="Any special instructions for the printer..."
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="delivery_location" className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Location
          </label>
          <input
            id="delivery_location"
            type="text"
            value={formData.delivery_location}
            onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
            className="form-input"
            placeholder="City, State or Address"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="file_upload" className="block text-sm font-medium text-gray-700 mb-2">
            Design File <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          {!uploadedFile ? (
            <div>
              <input
                ref={fileInputRef}
                id="file_upload"
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={loading || uploading}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.tiff,.tif,.psd,.ai,.eps,.svg,.doc,.docx,.zip"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your design file (PDF, images, or design files). Maximum size: 50MB
              </p>
              {uploading && (
                <div className="flex items-center gap-2 mt-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-blue-600">Uploading file...</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {uploadSuccess && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700 font-medium">File uploaded successfully!</p>
                </div>
              )}
              <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{uploadedFile.name}</span>
                      <span className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Uploaded successfully
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center">
          <input
            id="pickup_preferred"
            type="checkbox"
            checked={formData.pickup_preferred}
            onChange={(e) => setFormData({ ...formData, pickup_preferred: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={loading}
          />
          <label htmlFor="pickup_preferred" className="ml-2 block text-sm text-gray-900">
            Pickup preferred (instead of delivery)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Job (Draft)'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

