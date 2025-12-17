import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ArrowLeft, Lock, User, Building, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRestaurant } from '../context/RestaurantContext'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/shared/ui/card'
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Rich animated background - Red Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-100 via-gray-50 to-white -z-20"></div>
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-red-100/50 to-transparent -z-10"></div>

      {/* Decorative Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-red-300/30 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-32 -left-20 w-80 h-80 bg-rose-300/30 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full px-4 sm:px-6 lg:px-8"
      >
        <Card className="w-full max-w-md mx-auto shadow-2xl rounded-3xl border-gray-100 bg-white/90 backdrop-blur-xl relative top-5 mt-5">
          <CardHeader className="space-y-3 pt-8 relative">
            <button
              onClick={handleBack}
              className="absolute left-6 top-6 text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center shadow-inner border border-red-200"
              >
                <Settings className="w-10 h-10 text-red-600" />
              </motion.div>
            </div>

            <CardTitle className="text-3xl font-bold text-center text-gray-800 tracking-tight">
              Admin Panel
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base max-w-sm mx-auto">
              Configure menu, tables, and settings
            </CardDescription>

            {/* Display restaurant info if verified */}
            {restaurantName && restaurantCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mt-6 p-4 bg-green-50/80 border border-green-200 rounded-2xl shadow-sm max-w-xs backdrop-blur-sm"
              >
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-green-700" />
                  <span className="font-bold text-green-900">{restaurantName}</span>
                </div>
                <div className="flex items-center justify-center mt-1.5 space-x-2">
                  <span className="text-xs text-green-600 uppercase tracking-wide font-semibold">Store Code</span>
                  <span className="font-mono font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs tracking-wider">{restaurantCode}</span>
                </div>
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium ml-1">Email Address</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-red-600 focus:ring-red-600/20 focus-visible:ring-red-600 rounded-xl transition-all"
                    placeholder="admin@quickserve.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-red-600 focus:ring-red-600/20 focus-visible:ring-red-600 rounded-xl transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/40 transition-all duration-300 h-12 text-lg font-bold rounded-xl mt-4"
              >
                {loading ? 'Access Console' : 'Access Console'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default AdminLogin
