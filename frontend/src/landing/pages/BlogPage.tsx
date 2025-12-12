import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

const BlogPage: React.FC = () => {
  const navigate = useNavigate();

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
                <button onClick={() => navigate('/pricing')} className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                  Pricing
                </button>
                <button onClick={() => navigate('/blog')} className="text-red-600 font-medium">
                  Blog
                </button>
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

      {/* Blog Article */}
      <article className="pt-32 pb-32 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </button>
          </motion.div>

          {/* Article Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              How QR-Based Ordering Systems Are Revolutionizing Restaurant Operations in 2025
            </h1>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Discover how Quick Serve's integrated restaurant management platform combines QR code ordering, real-time kitchen communication, and smart table management to increase revenue and reduce operational costs.
            </p>

            <div className="flex items-center space-x-6 text-gray-500 text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>December 12, 2025</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>8 min read</span>
              </div>
            </div>
          </motion.header>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-lg max-w-none"
          >
            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Restaurant Industry's Digital Transformation</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The restaurant industry has undergone a massive shift in how customers interact with establishments. Gone are the days of waiting for a server to take your order or flagging someone down for the check. Today's diners expect seamless, contactless experiences that put them in control of their dining journey.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Quick Serve addresses this transformation head-on by providing a comprehensive restaurant management solution that connects every touchpoint—from the moment a customer sits down to when they complete payment. But what makes a truly effective restaurant management system, and why should restaurant owners pay attention?
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">What Is Quick Serve?</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Quick Serve is a cloud-based restaurant management platform that integrates QR code ordering technology with comprehensive back-of-house operations. The system creates a unified ecosystem where customers, front-of-house staff, kitchen teams, and management all work from synchronized, real-time data.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Unlike traditional point-of-sale systems that simply process transactions, Quick Serve acts as a central nervous system for your entire operation. Every order placed, every table status change, and every menu update flows through a single platform that keeps everyone aligned.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Core Capabilities That Drive Restaurant Success</h2>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Real-Time Order Management</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The order management system eliminates the traditional bottleneck between customer requests and kitchen preparation. When a customer places an order through the QR interface at their table, that order instantly appears on kitchen display screens with all relevant details—modifications, dietary restrictions, and preparation notes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Kitchen staff can update order status in real-time, allowing servers and customers to know exactly when food is being prepared, when it's ready for pickup, and when it's been delivered. This transparency reduces customer anxiety and server trips to the kitchen, improving efficiency across the board.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Smart Table Management</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Table turnover directly impacts revenue, yet many restaurants rely on gut instinct and manual tracking. Quick Serve's table management module provides visual floor plans with real-time status indicators showing which tables are occupied, which are awaiting food, which have finished eating, and which need cleaning.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Reception staff can see at a glance the optimal table for incoming parties based on party size, server workload distribution, and estimated availability times. This data-driven approach to seating maximizes capacity utilization while ensuring no single server becomes overwhelmed.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Dynamic Menu Control</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Running out of a popular item halfway through dinner service creates customer disappointment and awkward server interactions. Quick Serve's menu management system allows instant updates across all customer-facing interfaces. Mark an item as unavailable, and it immediately disappears from QR menus—no confused customers ordering something you can't deliver.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Beyond availability, the system supports dynamic pricing, daily specials, happy hour configurations, and seasonal menu rotations. All changes propagate instantly without requiring new printed menus or manual server briefings.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Role-Based Staff Dashboard</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Different roles need different information. A kitchen line cook doesn't need to see table assignments, and a host doesn't need detailed order modification history. Quick Serve provides customized dashboards based on staff roles—captains see their assigned tables and order status, kitchen staff see incoming orders and timing requirements, and reception sees the floor plan and reservation queue.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This role-based approach reduces information overload while ensuring everyone has immediate access to what they need to do their job effectively.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">QR-Powered Customer Portal</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              The customer experience begins when they scan a QR code at their table. Without downloading an app or creating an account, guests access the full menu with photos, descriptions, pricing, and allergen information. They can browse at their own pace, add items to their order, specify modifications, and submit when ready.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              This self-service model doesn't replace human hospitality—it enhances it. Servers spend less time taking orders and more time checking on satisfaction, making recommendations, and creating memorable experiences. Customers appreciate the control and never have to wait to order another round or request the check.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Integrated Payment Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-6">
              Payment friction at the end of a meal can sour an otherwise excellent experience. Quick Serve integrates multiple payment options directly into the customer portal—credit cards, digital wallets, and split payments among party members. Customers pay when they're ready without waiting for a check, calculating tip, and waiting again for processing.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              For restaurants, this means faster table turnover and fewer walkouts. The integrated system also simplifies end-of-day reconciliation, with all transactions logged and categorized automatically.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Why Restaurant Owners Are Making the Switch</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              The tangible benefits of implementing a system like Quick Serve extend across multiple dimensions of restaurant operations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Increased average order value:</strong> When customers browse a visual menu at their own pace, they tend to add more items. Studies show that digital ordering increases average ticket sizes by 15-20% compared to traditional ordering.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Reduced labor costs:</strong> While Quick Serve doesn't replace staff, it allows the same team to handle more tables efficiently. Order-taking time drops dramatically, letting servers focus on higher-value interactions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Improved order accuracy:</strong> When customers enter their own orders with specific modifications, communication errors between customers, servers, and kitchen staff virtually disappear. Fewer wrong orders mean fewer comped meals and happier customers.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Faster table turnover:</strong> Eliminating wait times for ordering and payment can reduce average table time by 15-25 minutes during peak hours. That's potentially an extra turn per table during busy service.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              <strong>Actionable data insights:</strong> Every interaction generates data—popular items, peak ordering times, average dining duration, and payment preferences. This information drives smarter business decisions around menu optimization, staffing levels, and marketing efforts.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Getting Started with Quick Serve</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Transitioning to a new restaurant management system can feel daunting, but Quick Serve is designed for straightforward implementation. The cloud-based architecture means no expensive hardware installations beyond tablets for staff dashboards and kitchen displays.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Menu digitization typically takes a few hours—upload your existing menu, add photos and descriptions, set pricing tiers, and generate QR codes for each table. Staff training is minimal since the interfaces are designed to be intuitive, resembling apps your team already uses daily.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Most restaurants see operational improvements within the first week of deployment, with full optimization occurring over the following month as staff become comfortable with new workflows and you fine-tune configurations to match your specific operation.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">The Future of Restaurant Technology</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              QR-based ordering isn't a pandemic-era workaround—it's the foundation of how modern restaurants will operate going forward. Customer expectations have permanently shifted toward digital convenience, and restaurants that fail to adapt risk losing market share to more tech-savvy competitors.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Quick Serve positions restaurants at the forefront of this evolution, providing the infrastructure to meet current expectations while remaining flexible enough to incorporate emerging technologies like AI-powered recommendations, predictive inventory management, and integrated loyalty programs.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Transform Your Restaurant Operations Today</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Whether you're running a bustling urban bistro, a multi-location chain, or a neighborhood café, Quick Serve scales to meet your needs. The combination of QR-based customer ordering, real-time kitchen communication, intelligent table management, and integrated payments creates an operational foundation that drives both customer satisfaction and bottom-line results.
            </p>
            <p className="text-gray-700 leading-relaxed mb-8">
              Ready to see how Quick Serve can transform your restaurant? Contact us for a demonstration and discover why restaurants across the industry are making the switch to smarter, more efficient operations.
            </p>

            {/* CTA Section */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl p-8 my-12 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-700 mb-6">
                Join thousands of restaurants already using Quick Serve to streamline operations and delight customers.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-red-500/40 transition-all duration-300"
              >
                Start Your Free Trial
              </Button>
            </div>

            {/* Keywords Section */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Primary Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {['restaurant management software', 'QR code ordering system', 'table management system', 'restaurant POS alternative', 'contactless ordering', 'digital menu system'].map((keyword, index) => (
                    <span key={index} className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Secondary Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {['kitchen display system', 'restaurant staff dashboard', 'payment integration restaurants', 'real-time order processing', 'restaurant technology 2025'].map((keyword, index) => (
                    <span key={index} className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </article>

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

export default BlogPage;
