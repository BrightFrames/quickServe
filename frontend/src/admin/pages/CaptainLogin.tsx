import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle, Lock, ChefHat, Eye, EyeOff, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const CaptainLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check slug first
      if (!restaurantSlug) {
        setError('Please access login through restaurant-specific URL');
        setLoading(false);
        return;
      }

      // Use captain-specific login endpoint via AuthContext with restaurantSlug
      const userData = await login(username, password, 'captain', restaurantSlug);

      // Override backend slug with URL slug and save to localStorage
      const updatedUser = {
        ...userData.user,
        restaurantSlug: restaurantSlug // Force URL slug, not backend database slug
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Redirect to dashboard with URL slug
      navigate(`/${restaurantSlug}/captain/dashboard`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
      {/* Rich animated background - Blue Theme */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-50 to-white -z-20"></div>
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-100/50 to-transparent -z-10"></div>

      {/* Decorative Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-300/30 rounded-full blur-3xl -z-10"
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
              className="absolute left-6 top-6 text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-inner border border-blue-200"
              >
                <Users className="w-10 h-10 text-blue-600" />
              </motion.div>
            </div>

            <CardTitle className="text-3xl font-bold text-center text-gray-800 tracking-tight">
              Captain App
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base max-w-sm mx-auto">
              Order taking interface for waiters
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-900 font-medium ml-1">Username</Label>
                <div className="relative group">
                  <UserCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-blue-600/20 focus-visible:ring-blue-600 rounded-xl transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium ml-1">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-blue-600/20 focus-visible:ring-blue-600 rounded-xl transition-all"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/40 transition-all duration-300 h-12 text-lg font-bold rounded-xl mt-4"
              >
                {loading ? "Logging in..." : "Launch App"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
export default CaptainLogin;
