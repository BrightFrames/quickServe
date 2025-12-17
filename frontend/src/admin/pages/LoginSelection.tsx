import { useNavigate } from 'react-router-dom'
import { ChefHat, Shield, Users } from 'lucide-react'

const LoginSelection = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <img
              src="/logo of quick serve.png"
              alt="QuickServe"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">QuickServe Admin Panel</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Admin Login Card */}
          <div
            onClick={() => navigate('/admin/login')}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Admin</h2>
              <p className="text-gray-600 text-center mb-6">
                Full access to dashboard, analytics, menu management, and user controls
              </p>
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Login as Admin
              </button>
            </div>
          </div>

          {/* Kitchen Login Card */}
          <div
            onClick={() => navigate('/kitchen/login')}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <ChefHat className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Kitchen / Cook</h2>
              <p className="text-gray-600 text-center mb-6">
                Manage orders, update preparation status, and track deliveries
              </p>
              <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                Login as Kitchen Staff
              </button>
            </div>
          </div>

          {/* Captain Login Card */}
          <div
            onClick={() => navigate('/captain/login')}
            className="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-12 h-12 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Captain / Waiter</h2>
              <p className="text-gray-600 text-center mb-6">
                Take orders on behalf of customers and send directly to kitchen
              </p>
              <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Login as Captain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSelection
