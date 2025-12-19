export default function PrinterLayout({
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
              <a href="/printer/dashboard" className="text-xl font-bold">
                Printer Dashboard
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/printer/jobs" className="text-gray-700 hover:text-gray-900">
                Available Jobs
              </a>
              <a href="/printer/bids" className="text-gray-700 hover:text-gray-900">
                My Bids
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}

