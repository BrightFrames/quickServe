import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRestaurant } from '../context/RestaurantContext'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
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
      await login(email, password, 'admin', restaurantCode || undefined)
      toast.success('Login successful!')
      navigate(`/${restaurantSlug}/admin/dashboard`)
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

    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-sm border border-gray-200 bg-white">
        <CardHeader className="space-y-1 pb-6 relative">
          <button
            onClick={handleBack}
            className="absolute left-6 top-6 text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold text-center text-gray-900">
            Admin Panel
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Configure menu, tables, and settings
          </CardDescription>

          {/* Display restaurant info if verified */}
          {restaurantName && restaurantCode && (
            <div className="mx-auto mt-6 p-4 bg-gray-50 border border-gray-200 rounded max-w-xs">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Building className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{restaurantName}</span>
              </div>
              <div className="flex items-center justify-center mt-1.5 space-x-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Store Code</span>
                <span className="font-mono font-medium text-gray-900 bg-gray-200 px-2 py-0.5 rounded text-xs">{restaurantCode}</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
                placeholder="admin@quickserve.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="flex justify-end pt-1">
                <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-medium"
            >
              {loading ? 'Accessing Console...' : 'Access Console'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminLogin
