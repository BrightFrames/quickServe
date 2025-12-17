import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChefHat, ArrowLeft, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useRestaurant } from '../context/RestaurantContext'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

const KitchenLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { restaurantSlug } = useParams()
  const { login } = useAuth()
  const { restaurantCode } = useRestaurant()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear customer session markers if they exist
    sessionStorage.removeItem('userType')
    sessionStorage.removeItem('customerSessionStart')
    sessionStorage.removeItem('adminVerified')
    sessionStorage.removeItem('adminVerifiedAt')

    // Validate restaurant identifier exists
    const identifier = restaurantSlug || restaurantCode;
    if (!identifier) {
      toast.error('Restaurant identifier is missing. Please access login via restaurant URL.');
      return;
    }

    setLoading(true)

    try {
      // Pass restaurantSlug as identifier for restaurant-specific kitchen access
      console.log('[KITCHEN LOGIN] Attempting login with identifier:', identifier);
      await login(username, password, 'kitchen', identifier)
      toast.success('Login successful!')
      // Always navigate with restaurant slug
      navigate(`/${restaurantSlug}/kitchen/dashboard`)
    } catch (error: any) {
      console.error('[KITCHEN LOGIN] Login failed:', error.response?.data || error.message);
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
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Rich animated background - Orange Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100 via-gray-50 to-white -z-20"></div>
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-orange-100/50 to-transparent -z-10"></div>

      {/* Decorative Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-32 -left-20 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl -z-10"
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
              className="absolute left-6 top-6 text-gray-400 hover:text-orange-500 transition-colors p-2 hover:bg-orange-50 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center shadow-inner border border-orange-200"
              >
                <ChefHat className="w-10 h-10 text-orange-500" />
              </motion.div>
            </div>

            <CardTitle className="text-3xl font-bold text-center text-gray-800 tracking-tight">
              Kitchen View
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base max-w-sm mx-auto">
              Real-time order display for chefs
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-900 font-medium ml-1">Username</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 focus-visible:ring-orange-500 rounded-xl transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-orange-500/20 focus-visible:ring-orange-500 rounded-xl transition-all"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-orange-500/40 transition-all duration-300 h-12 text-lg font-bold rounded-xl mt-4"
              >
                {loading ? 'Logging in...' : 'Launch Display'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default KitchenLogin
