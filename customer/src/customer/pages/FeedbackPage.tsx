import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackForm } from '../components/FeedbackForm';

export const FeedbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || undefined;

  const handleFeedbackSubmit = (rating: number, feedback: string) => {
    console.log('Feedback submitted:', { rating, feedback, orderId });
    
    // Navigate back to menu after 2 seconds
    setTimeout(() => {
      navigate('/customer/menu');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/customer/menu')}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Feedback</h1>
        </div>
      </div>

      {/* Feedback Form */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <FeedbackForm orderId={orderId} onSubmit={handleFeedbackSubmit} />
      </div>
    </div>
  );
};
