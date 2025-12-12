import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, UtensilsCrossed, Sparkles, ArrowRight, Clock, Users, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { AuroraBackground } from '../components/ui/aurora-background';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'landing' | 'login' | 'signup';

const LandingPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('landing');
  const { restaurant } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (restaurant && restaurant.slug) {
      navigate(`/${restaurant.slug}/dashboard`, { replace: true });
    }
  }, [restaurant, navigate]);

  const features = [
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Real-time order processing that keeps your kitchen moving",
    },
    {
      icon: Users,
      title: "Customer First",
      description: "Intuitive experiences that turn guests into regulars",
    },
    {
      icon: TrendingUp,
      title: "Data Driven",
      description: "Analytics that reveal what's working and what's not",
    },
    {
      icon: Shield,
      title: "Rock Solid",
      description: "Enterprise-grade security protecting your business",
    },
  ];

  if (authMode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setAuthMode('landing')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 mb-6 transition-colors font-medium"
            >
              <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
              Back to home
            </button>
          </div>
          <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
        </div>
      </div>
    );
  }

  if (authMode === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setAuthMode('landing')}
              className="inline-flex items-center text-sm text-gray-600 hover:text-red-600 mb-6 transition-colors font-medium"
            >
              <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
              Back to home
            </button>
          </div>
          <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                <img src="/icon of the quick serve.png" alt="QuickServe" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                QuickServe
              </span>
            </div>
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  About
                </button>
                <button onClick={() => navigate('/pricing')} className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  Pricing
                </button>
                <button onClick={() => navigate('/blog')} className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  Blog
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setAuthMode('login')}
                  className="text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => setAuthMode('signup')}
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-300"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Aurora Background */}
      <section className="relative flex flex-col h-[100vh] items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative flex flex-col gap-8 items-center justify-center px-4 pt-16"
        >
          <div className="text-center max-w-5xl">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="text-gray-900">
                Restaurant
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
                Management
              </span>
              <br />
              <span className="text-gray-900">
                Reimagined
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              The modern operating system for ambitious restaurants. 
              From orders to insights, everything you need in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => setAuthMode('signup')}
                className="bg-red-600 hover:bg-red-700 text-white text-lg px-12 py-7 shadow-2xl hover:shadow-red-500/40 transition-all duration-300 rounded-2xl font-semibold"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setAuthMode('login')}
                className="bg-white hover:bg-gray-50 border-2 border-red-600 hover:border-red-700 text-red-600 hover:text-red-700 text-lg px-12 py-7 rounded-2xl font-semibold transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 mb-2">No credit card required • 14-day free trial</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Built for <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">Speed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to run a modern restaurant, 
              designed with obsessive attention to detail.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full p-8 rounded-3xl border border-gray-200 hover:border-red-500 bg-white hover:bg-red-50/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.15),transparent_50%)]"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Transform
              <br />
              Your Restaurant?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of restaurants already using QuickServe 
              to streamline operations and delight customers.
            </p>
            <Button
              size="lg"
              onClick={() => setAuthMode('signup')}
              className="bg-red-600 hover:bg-red-700 text-white text-lg px-12 py-7 shadow-2xl hover:shadow-red-500/40 transition-all duration-300 rounded-2xl font-semibold"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-6 text-gray-400 text-sm">
              14 days free • No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl shadow-md overflow-hidden">
                <img src="/icon of the quick serve.png" alt="QuickServe" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickServe</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2024 QuickServe. Crafted with care for restaurants.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;