import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, ArrowRight, AppWindow, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import Navbar from '../components/Navbar';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  const posts: BlogPost[] = [
    {
      id: 'qr-ordering-2025',
      title: "How QR-Based Ordering Systems Are Revolutionizing Restaurant Operations in 2025",
      excerpt: "Discover how integrated platforms combine QR code ordering, real-time kitchen communication, and smart table management to increase revenue.",
      date: "December 12, 2025",
      readTime: "8 min read",
      category: "Technology",
      image: "/image.png"
    },
    {
      id: 'kitchen-efficiency',
      title: "Maximizing Kitchen Efficiency: From Order to Plate",
      excerpt: "Learn the secrets of top-tier kitchen management. Reduce ticket times and improve staff coordination with digital display systems.",
      date: "December 08, 2025",
      readTime: "5 min read",
      category: "Operations",
      image: "/image.png" // Placeholder
    },
    {
      id: 'staff-retention',
      title: "The Ultimate Guide to Staff Retention and Management",
      excerpt: "Empower your team with the right tools. How role-based dashboards and clear communication channels reduce burnout and turnover.",
      date: "December 01, 2025",
      readTime: "6 min read",
      category: "Management",
      image: "/image.png" // Placeholder
    }
  ];

  const handleReadMore = (post: BlogPost) => {
    setActivePost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActivePost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Navigation */}
      <Navbar />

      <div className="pt-24 min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          {!activePost ? (
            <ListingView key="listing" posts={posts} onReadMore={handleReadMore} />
          ) : (
            <DetailView key="detail" post={activePost} onBack={handleBack} navigate={navigate} />
          )}
        </AnimatePresence>
      </div>

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

const ListingView = ({ posts, onReadMore }: { posts: BlogPost[], onReadMore: (p: BlogPost) => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
  >
    <div className="text-center mb-16">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-900 mb-6">
        Latest Insights & Updates
      </h1>
      <p className="text-lg md:text-xl text-gray-900 max-w-2xl mx-auto">
        Expert advice on restaurant management, technology trends, and operational efficiency.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
        >
          <div className="h-48 bg-gray-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-blue-900/0 transition-colors duration-300" />
            <img src={post.image} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-blue-900 uppercase tracking-wide shadow-sm">
              {post.category}
            </div>
          </div>

          <div className="p-8 flex flex-col flex-grow">
            <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> {post.date}</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> {post.readTime}</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-900 transition-colors cursor-pointer" onClick={() => onReadMore(post)}>
              {post.title}
            </h3>

            <p className="text-gray-600 mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            <div className="mt-auto">
              <button
                onClick={() => onReadMore(post)}
                className="inline-flex items-center text-blue-900 font-semibold hover:text-blue-700 transition-colors"
              >
                Read Article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const DetailView = ({ post, onBack, navigate }: { post: BlogPost, onBack: () => void, navigate: any }) => (
  <motion.article
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
  >
    <button
      onClick={onBack}
      className="inline-flex items-center text-gray-600 hover:text-blue-900 mb-8 transition-colors font-medium"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Articles
    </button>

    <header className="mb-12 text-center">
      <div className="inline-block bg-blue-50 text-blue-800 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
        {post.category}
      </div>
      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
        {post.title}
      </h1>
      <div className="flex items-center justify-center space-x-6 text-gray-500 text-sm">
        <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> {post.date}</span>
        <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {post.readTime}</span>
      </div>
    </header>

    {/* Section 1: Intro - White Card */}
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">The Restaurant Industry's Digital Transformation</h2>
      <p className="text-gray-700 leading-relaxed mb-6 text-lg">
        The restaurant industry has undergone a massive shift. Gone are the days of waiting for a server. Today's diners expect seamless, contactless experiences.
      </p>
      <p className="text-gray-900 leading-relaxed text-lg">
        Quick Serve addresses this transformation by providing a comprehensive solution that connects every touchpoint—from ordering to payment.
      </p>
    </div>

    {/* Section 2: Core Capabilities - Gray Card */}
    <div className="bg-gray-100 rounded-3xl p-8 md:p-12 mb-8 shadow-inner">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
        <AppWindow className="w-8 h-8 text-blue-900 mr-4" />
        Core Capabilities
      </h2>

      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Real-Time Order Management</h3>
          <p className="text-gray-900">Eliminates bottlenecks. Orders instantly appear on kitchen screens with all modification details.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Table Management</h3>
          <p className="text-gray-900">Visual floor plans with real-time status. Maximize capacity and turnover.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Dynamic Menu Control</h3>
          <p className="text-gray-900">Instant updates. Mark items unavailable or change prices in real-time across all QR menus.</p>
        </div>
      </div>
    </div>

    {/* Section 3: Why Switch - White Card */}
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Owners Are Making the Switch</h2>
      <ul className="space-y-4">
        {[
          "Increased average order value by 15-20%",
          "Reduced labor costs and improved focus",
          "Improved order accuracy and fewer errors",
          "Faster table turnover (15-25 mins saved)",
          "Actionable data insights for business growth"
        ].map((item, idx) => (
          <li key={idx} className="flex items-start">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
              <ChevronRight className="w-4 h-4 text-blue-900" />
            </div>
            <span className="text-gray-900 text-lg">{item}</span>
          </li>
        ))}
      </ul>
    </div>

    {/* Section 4: CTA - Blue Highlight Card */}
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
      <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
      <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
        Join thousands of restaurants using Quick Serve to streamline operations.
      </p>
      <Button
        onClick={() => navigate('/')}
        className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all"
      >
        Start Free Trial
      </Button>
    </div>

  </motion.article>
);

export default BlogPage;
