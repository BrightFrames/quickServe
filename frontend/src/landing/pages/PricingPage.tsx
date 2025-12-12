import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const pricingPlans = [
    {
      title: "Monthly Plan",
      price: "₹699",
      period: "/month",
      description: "Perfect for getting started with QuickServe",
      features: [
        "Real-time order management",
        "Table & menu management",
        "Staff dashboard access",
        "Customer QR ordering",
        "Payment gateway integration",
        "Basic analytics",
        "Email support",
        "Regular updates"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      title: "Yearly Plan",
      price: "₹6,999",
      period: "/year",
      description: "Best value with 2 months free",
      features: [
        "Everything in Monthly Plan",
        "Priority support 24/7",
        "Advanced analytics & reports",
        "Custom branding",
        "Multi-location support",
        "Inventory management",
        "Promo code system",
        "Dedicated account manager"
      ],
      cta: "Get Started",
      popular: true,
      savings: "Save ₹1,400"
    }
  ];

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button onClick={() => navigate('/')} className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                <img src="/icon of the quick serve.png" alt="QuickServe" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                QuickServe
              </span>
            </button>
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  About
                </button>
                <button onClick={() => navigate('/pricing')} className="text-red-600 font-medium">
                  Pricing
                </button>
                <a href="/#blog" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  Blog
                </a>
              </div>
              <Button 
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-300"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-32 pb-32 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Simple, <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that works best for your restaurant. No hidden fees, no surprises.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={`h-full bg-white rounded-3xl p-8 shadow-xl border-2 transition-all duration-300 flex flex-col ${
                  plan.popular 
                    ? 'border-red-600 hover:shadow-2xl hover:border-red-700' 
                    : 'border-gray-200 hover:border-red-500 hover:shadow-2xl'
                }`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>

                  <div className="mb-6 min-h-[120px]">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-xl text-gray-600 ml-2">{plan.period}</span>
                    </div>
                    <div className="mt-2 h-8">
                      {plan.savings && (
                        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {plan.savings}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/')}
                    className="w-full py-6 text-lg font-semibold rounded-2xl mb-8 transition-all duration-300 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/40"
                  >
                    {plan.cta}
                    <ArrowRight className="inline-block ml-2 h-5 w-5" />
                  </Button>

                  <div className="space-y-4 flex-grow">
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">What's Included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center bg-white p-8 rounded-3xl shadow-xl border border-gray-200 max-w-3xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need a Custom Plan?</h3>
            <p className="text-gray-600 mb-6">
              Running multiple locations or have specific requirements? We offer custom enterprise solutions tailored to your needs.
            </p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-2 border-red-600 hover:border-red-700 text-red-600 hover:text-red-700 px-8 py-6 text-lg font-semibold rounded-2xl transition-all duration-300"
            >
              Contact Sales
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <p className="text-gray-500 text-sm mb-4">Trusted by 1000+ restaurants worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
              <span>✓ No credit card required</span>
              <span>✓ 14-day free trial</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 24/7 Support</span>
            </div>
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
              © 2025 QuickServe. Crafted with care for restaurants.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PricingPage;
