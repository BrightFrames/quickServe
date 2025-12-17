import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, TrendingUp, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'landing' | 'login' | 'signup';

const LandingPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('landing');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).mode) {
      setAuthMode((location.state as any).mode);
      // Optional: Clear state so refresh/back doesn't loop, but strictly not required for this simple case
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (restaurant && restaurant.slug) {
      navigate(`/${restaurant.slug}/dashboard`, { replace: true });
    }
  }, [restaurant, navigate]);



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
      <Navbar />

      {/* Hero Section with Aurora Background */}
      <section className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.8,
                ease: "easeOut",
              }}
              className="space-y-8 px-4"
            >
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-5xl font-bold leading-tight text-gray-900 break-words">
                Streamline Your Restaurant Operations & Order Management
              </h1>

              <p className="text-base sm:text-lg text-gray-900 leading-relaxed max-w-2xl mx-auto px-4">
                The complete solution for restaurants, cafes, and food businesses to manage everything from orders to kitchen and staff.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                <Button
                  size="lg"
                  onClick={() => setAuthMode('signup')}
                  className="bg-blue-900 hover:bg-blue-950 text-white text-base px-8 py-6 shadow-lg transition-all duration-300 rounded-md font-semibold"
                >
                  Get Started
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setAuthMode('login')}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 text-base px-8 py-6 rounded-md font-semibold transition-all duration-300"
                >
                  Sign In
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Device Mockup Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full">
                <img
                  src="/image.png"
                  alt="QuickServe Dashboard on multiple devices"
                  className="w-full h-auto object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-2"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4 break-words px-4">
              Why QuickServe?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1: Multi-Panel System (Left) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-72 h-72 -mb-20 flex items-center justify-center rounded-2xl mx-auto transition-transform duration-300 group-hover:scale-105">
                  <img src="/multipanel.png" alt="Multi-Panel System" className="w-72 h-72 object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Multi-Panel System
                </h3>
                <p className="text-gray-900 leading-relaxed max-w-xs mx-auto">
                  Seamlessly connect Admin, Kitchen, and Staff panels for unified operations.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: Faster Order Handling (Center) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-72 h-72 -mb-20 flex items-center justify-center rounded-2xl mx-auto transition-transform duration-300 group-hover:scale-105">
                  <img src="/stopwatch.png" alt="Faster Order Handling" className="w-72 h-72 object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Faster Order Handling
                </h3>
                <p className="text-gray-900 leading-relaxed max-w-xs mx-auto">
                  Efficiently receive, process, and fulfill orders to reduce wait times.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Better Restaurant Control (Right) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-center group"
            >
              <div className="flex flex-col items-center">
                <div className="w-72 h-72 -mb-20 flex items-center justify-center rounded-2xl mx-auto transition-transform duration-300 group-hover:scale-105">
                  <img src="/settings.png" alt="Better Restaurant Control" className="w-72 h-72 object-contain" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Better Restaurant Control
                </h3>
                <p className="text-gray-900 leading-relaxed max-w-xs mx-auto">
                  Gain insights and manage every aspect of your business with clarity.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Easy Setup Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Come with Easy Setup
            </h2>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0 }}
              whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-200 flex-1 w-full max-w-xs h-64 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center h-full justify-center">
                <Users className="h-16 w-16 text-blue-900 mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Register
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  Sign up with your restaurant's details
                </p>
              </div>
            </motion.div>

            <ArrowRight className="h-8 w-8 text-blue-900 hidden lg:block flex-shrink-0" strokeWidth={2} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-200 flex-1 w-full max-w-xs h-64 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center h-full justify-center">
                <UtensilsCrossed className="h-16 w-16 text-blue-900 mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Add Menu
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  Upload dishes & set prices.
                </p>
              </div>
            </motion.div>

            <ArrowRight className="h-8 w-8 text-blue-900 hidden lg:block flex-shrink-0" strokeWidth={2} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-200 flex-1 w-full max-w-xs h-64 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center h-full justify-center">
                <Sparkles className="h-16 w-16 text-blue-900 mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Customize
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  Match the platform to your brand.
                </p>
              </div>
            </motion.div>

            <ArrowRight className="h-8 w-8 text-blue-900 hidden lg:block flex-shrink-0" strokeWidth={2} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -8, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-200 flex-1 w-full max-w-xs h-64 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center h-full justify-center">
                <TrendingUp className="h-16 w-16 text-blue-900 mb-6" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Go Live
                </h3>
                <p className="text-sm text-gray-900 leading-relaxed">
                  Start accepting orders instantly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "What is QuickServe?",
                answer: "QuickServe is a comprehensive restaurant management platform designed to streamline every aspect of your dining business. From order processing to customer engagement, we provide the tools modern restaurants need to thrive in today's competitive market."
              },
              {
                question: "What makes QuickServe a class apart?",
                answer: "QuickServe combines powerful features with an intuitive interface. Our real-time order management, multi-panel system for staff coordination, advanced analytics, and enterprise-grade security set us apart. Plus, we offer seamless integration with payment gateways and QR-based ordering for customers."
              },
              {
                question: "My Restaurant is already doing quite well in business. Why should I opt for QuickServe?",
                answer: "Even successful restaurants can benefit from improved efficiency and insights. QuickServe helps reduce order processing time, minimize errors, provide valuable analytics about customer behavior and sales trends, and enhance customer experience with faster service. It's about taking your successful business to the next level."
              },
              {
                question: "Can I make QuickServe's online food ordering system look like my own Restaurant's app?",
                answer: "Yes! QuickServe offers extensive customization options. You can customize colors and branding to match your restaurant's identity, add your logo and restaurant information, and configure menu layouts and categories. The customer-facing interface can be tailored to reflect your brand perfectly."
              },
              {
                question: "How can I get my customers to order directly?",
                answer: "QuickServe provides QR codes that you can place on tables, menus, or promotional materials. Customers simply scan the code with their phones to access your menu and place orders directly. No app download required! You can also share a direct link to your ordering page via social media or your website."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden rounded-lg"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white p-6 flex justify-between items-center transition-all duration-300"
                >
                  <span className="text-left font-medium text-lg pr-4">{faq.question}</span>
                  <span className="text-2xl flex-shrink-0">
                    {openFaqIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg"
                  >
                    <p className="p-6 text-gray-900 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-white rounded-xl shadow-md overflow-hidden">
                <img src="/logo of quick serve.png" alt="QuickServe" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-blue-900">QuickServe</span>
            </div>
            <p className="text-gray-900 text-sm">
              © 2024 QuickServe. Crafted with care for restaurants.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;