import React, { useState } from 'react';
import { ChefHat, Star, Clock, Shield, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

type AuthMode = 'landing' | 'login' | 'signup';

const LandingPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('landing');

  const features = [
    {
      icon: Clock,
      title: "Real-time Orders",
      description: "Track orders from placement to delivery with live updates",
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "Manage customer data and preferences seamlessly",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your restaurant data",
    },
    {
      icon: Star,
      title: "Analytics & Insights",
      description: "Make data-driven decisions with detailed analytics",
    },
  ];

  const testimonials = [
    {
      name: "Maria Rodriguez",
      restaurant: "Casa Delicious",
      quote: "QuickServe transformed how we manage orders. Our efficiency increased by 40%!",
      rating: 5,
    },
    {
      name: "John Chen",
      restaurant: "Dragon Palace",
      quote: "The customer app makes ordering so easy. Our guests love the seamless experience.",
      rating: 5,
    },
    {
      name: "Sarah Johnson",
      restaurant: "The Garden Bistro",
      quote: "Best investment we made for our restaurant. The analytics help us optimize everything.",
      rating: 5,
    },
  ];

  if (authMode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setAuthMode('landing')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full space-y-8">
          <div className="text-center">
            <button
              onClick={() => setAuthMode('landing')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src="/icon of the quick serve.png" 
                alt="QuickServe Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-2xl font-bold text-gray-900">QuickServe</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setAuthMode('login')}>
                Sign In
              </Button>
              <Button onClick={() => setAuthMode('signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fadeIn">
              Revolutionize Your
              <br />
              <span className="text-green-200">Restaurant Management</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-50 max-w-3xl mx-auto">
              Streamline orders, manage customers, and boost your restaurant's efficiency 
              with our comprehensive management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3"
                onClick={() => setAuthMode('signup')}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3"
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Restaurant
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From order management to customer analytics, QuickServe provides all the tools 
              you need to succeed in the modern restaurant industry.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Setup, Powerful Results
            </h2>
            <p className="text-xl text-gray-600">
              Get started with QuickServe in just three easy steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600">Create your restaurant account and set up your profile in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Configure</h3>
              <p className="text-gray-600">Add your menu items, tables, and customize your restaurant settings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Launch</h3>
              <p className="text-gray-600">Start taking orders and managing your restaurant like never before</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Restaurant Owners
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers are saying about QuickServe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.restaurant}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 hero-gradient">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Restaurant?
          </h2>
          <p className="text-xl text-green-50 mb-8">
            Join thousands of restaurants already using QuickServe to streamline their operations
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3"
            onClick={() => setAuthMode('signup')}
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <img 
                src="/icon of the quick serve.png" 
                alt="QuickServe Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">QuickServe</span>
            </div>
            <p className="text-gray-400 text-center md:text-left">
              © 2024 QuickServe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;