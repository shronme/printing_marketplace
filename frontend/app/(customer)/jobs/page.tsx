export default function CustomerJobsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <a
          href="/customer/jobs/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Job
        </a>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Your jobs will appear here. Job management will be implemented in EPIC 2.
        </p>
      </div>
    </div>
  )
}

