import { useEffect, useState } from 'react';
import { Utensils } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  minDuration?: number;
}

const LoadingScreen = ({ onLoadingComplete, minDuration = 2000 }: LoadingScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Icon container with pulse animation */}
        <div className="relative">
          {/* Outer ring pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-white/30 animate-ping-slow"></div>
          </div>

          {/* Middle ring pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-white/20 animate-ping-slower"></div>
          </div>

          {/* Icon with bounce animation */}
          <div className="relative bg-white rounded-full p-4 shadow-2xl animate-bounce-slow overflow-hidden w-24 h-24 flex items-center justify-center">
            <img
              src="/logo of quick serve.png"
              alt="QuickServe"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Brand name */}
        <div className="mt-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in">
            QuickServe
          </h1>
          <p className="text-blue-100 text-lg animate-fade-in animation-delay-500">
            Elevate Your Dining Experience
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-8 animate-fade-in animation-delay-1000">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-0"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(30px, 10px) scale(1.05);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }

        @keyframes ping-slower {
          0% {
            transform: scale(0.9);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0;
          }
          100% {
            transform: scale(0.9);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slower 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
