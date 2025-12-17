import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import Navbar from '../components/Navbar';

const PricingPage: React.FC = () => {

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
      <Navbar />

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
              Simple, <span className="bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto leading-relaxed">
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
                    <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={`h-full bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col border ${plan.popular
                  ? 'border-blue-500 ring-4 ring-blue-500/10'
                  : 'border-gray-100 hover:border-blue-200'
                  }`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                    <p className="text-gray-900">{plan.description}</p>
                  </div>

                  <div className="mb-6 min-h-[120px]">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-xl text-gray-900 ml-2">{plan.period}</span>
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
                    className={`w-full py-6 text-lg font-bold rounded-2xl mb-8 transition-all duration-300 shadow-lg ${plan.popular
                      ? 'bg-blue-900 hover:bg-blue-800 text-white hover:shadow-blue-900/40'
                      : 'bg-white text-blue-900 border-2 border-blue-100 hover:border-blue-900 hover:bg-blue-50'
                      }`}
                  >
                    {plan.cta}
                    <ArrowRight className="inline-block ml-2 h-5 w-5" />
                  </Button>

                  <div className="space-y-4 flex-grow">
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">What's Included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check className="h-5 w-5 text-blue-900 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-900">{feature}</span>
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
            <p className="text-gray-900 mb-6">
              Running multiple locations or have specific requirements? We offer custom enterprise solutions tailored to your needs.
            </p>
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-50 border-2 border-blue-900 hover:border-blue-800 text-blue-900 hover:text-blue-800 px-8 py-6 text-lg font-semibold rounded-2xl transition-all duration-300"
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
                <img src="/icon of the quick serve.png" alt="QuickServe" className="w-full h-full object-cover" style={{ filter: 'hue-rotate(220deg) brightness(0.7) saturate(1.2)' }} />
              </div>
              <span className="text-xl font-bold text-blue-900">QuickServe</span>
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
