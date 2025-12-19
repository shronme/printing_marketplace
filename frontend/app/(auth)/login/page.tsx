export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>
        <p className="text-gray-600 mb-4">
          Authentication will be implemented in EPIC 1
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="your@email.com"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="••••••••"
              disabled
            />
          </div>
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            disabled
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}

