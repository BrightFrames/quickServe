import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, Lock, User, Building } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRestaurant } from '../context/RestaurantContext'
import { toast } from 'sonner'

const AdminLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { restaurantName, restaurantCode, restaurantSlug } = useRestaurant()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear customer session markers if they exist
    sessionStorage.removeItem('userType')
    sessionStorage.removeItem('customerSessionStart')
    sessionStorage.removeItem('adminVerified')
    sessionStorage.removeItem('adminVerifiedAt')
    
    setLoading(true)

    try {
      // Pass restaurantCode for restaurant-specific admin access
      await login(username, password, 'admin', restaurantCode || undefined)
      toast.success('Login successful!')
      navigate('/admin/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    // Go back to restaurant dashboard if slug is available
    if (restaurantSlug) {
      navigate(`/${restaurantSlug}/dashboard`)
    } else {
      navigate(-1) // Go back in history
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50">
      <div className="max-w-md w-full p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-8">
            <button
              onClick={handleBack}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
              <p className="text-gray-600 mt-2">Access the admin dashboard</p>
              
              {/* Display restaurant info if verified */}
              {restaurantName && restaurantCode && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <Building className="w-4 h-4 text-green-700" />
                    <span className="font-semibold text-green-900">{restaurantName}</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Code: <span className="font-mono font-bold">{restaurantCode}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Use your restaurant email and password (the same credentials you used during restaurant registration)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Restaurant Account)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your restaurant email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
