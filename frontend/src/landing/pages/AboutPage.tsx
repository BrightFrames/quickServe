import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const AboutPage: React.FC = () => {

  return (
    <>
      {/* Navigation */}
      {/* Navigation */}
      {/* Navigation */}
      <Navbar />

      <section className="pt-32 pb-32 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              About <span className="text-blue-900">QuickServe</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-900 max-w-3xl mx-auto leading-relaxed font-light">
              Revolutionizing restaurant operations with cutting-edge technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-gray-900">Who We Are</h2>
              <p className="text-lg text-gray-900 leading-relaxed">
                QuickServe is a comprehensive restaurant management platform designed to streamline every aspect of your dining business. From order processing to customer engagement, we provide the tools modern restaurants need to thrive in today's competitive market.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                Built with restaurant owners, managers, and staff in mind, our platform eliminates complexity while maximizing efficiency. We understand the challenges of running a restaurant, and we've engineered solutions that work seamlessly in real-world environments.
              </p>
              <p className="text-lg text-gray-900 leading-relaxed">
                Whether you're managing a single location or multiple establishments, QuickServe scales with your business, providing enterprise-grade features with an intuitive interface that your team will love.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Core Functionality</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Order Management:</strong> Real-time order processing from table to kitchen with instant updates</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Table Management:</strong> Smart seating arrangements and table status tracking</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Menu Control:</strong> Dynamic menu management with real-time updates across all channels</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Staff Dashboard:</strong> Role-based access for captains, kitchen staff, and reception</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Customer Portal:</strong> Seamless ordering experience with QR code integration</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-900 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-900"><strong>Payment Processing:</strong> Integrated payment gateway with multiple payment options</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white p-10 rounded-3xl shadow-xl border border-gray-200 mb-12"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Complete Feature Set</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Operations</h4>
                <ul className="space-y-2 text-gray-900">
                  <li>• Multi-tenant architecture</li>
                  <li>• Real-time order tracking</li>
                  <li>• Kitchen display system</li>
                  <li>• Inventory management</li>
                  <li>• Promo code system</li>
                  <li>• Order lifecycle management</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Analytics & Insights</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Sales analytics dashboard</li>
                  <li>• Customer behavior tracking</li>
                  <li>• Revenue reports</li>
                  <li>• Performance metrics</li>
                  <li>• Trend analysis</li>
                  <li>• Custom reporting</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Customer Experience</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• QR code ordering</li>
                  <li>• Rating & feedback system</li>
                  <li>• Digital invoicing</li>
                  <li>• Order history</li>
                  <li>• Custom branding</li>
                  <li>• Mobile-optimized interface</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Security</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Role-based access control</li>
                  <li>• Secure authentication</li>
                  <li>• Data encryption</li>
                  <li>• Activity logging</li>
                  <li>• PCI compliance</li>
                  <li>• Password hashing</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Integration</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Payment gateway integration</li>
                  <li>• Third-party APIs</li>
                  <li>• Cashfree support</li>
                  <li>• PhonePe integration</li>
                  <li>• Custom webhooks</li>
                  <li>• REST API access</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-blue-900 text-lg">Support</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• 24/7 technical support</li>
                  <li>• Onboarding assistance</li>
                  <li>• Training resources</li>
                  <li>• Regular updates</li>
                  <li>• Priority support</li>
                  <li>• Documentation library</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center bg-white p-8 rounded-3xl shadow-xl border border-gray-200"
          >
            <p className="text-gray-500 text-sm mb-3">Proudly Powered by</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/BrightFrame_logo.jpg" alt="Bright Frame" className="w-12 h-12 object-contain" />
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                Bright Frame
              </p>
            </div>
            <p className="text-gray-900 max-w-2xl mx-auto">
              Building innovative solutions that empower businesses to achieve excellence through technology
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
                <img src="/icon of the quick serve.png" alt="QuickServe" className="w-full h-full object-cover" style={{ filter: 'hue-rotate(220deg) brightness(0.7) saturate(1.2)' }} />
              </div>
              <span className="text-xl font-bold text-gray-900">QuickServe</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 QuickServe. Crafted with care for restaurants.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default AboutPage;
