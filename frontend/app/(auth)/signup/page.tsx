export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-24">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
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
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select className="w-full px-4 py-2 border rounded-lg" disabled>
              <option>Customer</option>
              <option>Printer</option>
            </select>
          </div>
          <button
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            disabled
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}

