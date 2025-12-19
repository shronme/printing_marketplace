export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Customer Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/customer/jobs" className="text-gray-700 hover:text-gray-900">
                My Jobs
              </a>
              <a href="/customer/bids" className="text-gray-700 hover:text-gray-900">
                Bids
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

