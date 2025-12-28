import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Eye, EyeOff, Users, ArrowLeft } from "lucide-react";
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
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>

          <CardTitle className="text-2xl font-semibold text-center text-gray-900">
            Captain Login
          </CardTitle>
          <CardDescription className="text-center text-gray-500">
            Enter your credentials to access the terminal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-center">
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white pr-10"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 font-medium"
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default CaptainLogin;
