import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Card } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface FeedbackFormProps {
  orderId?: string;
  onSubmit?: (rating: number, feedback: string) => void;
}

export const FeedbackForm = ({ orderId, onSubmit }: FeedbackFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
      onSubmit?.(rating, feedback);
      toast.success('Thank you for your feedback!');
    }, 500);
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center animate-scale-in">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
          <Star className="h-8 w-8 text-white fill-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
        <p className="text-muted-foreground">
          Your feedback helps us serve you better
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">How was your experience?</h2>
          <p className="text-muted-foreground">
            Your feedback helps us improve our service
          </p>
          {orderId && (
            <p className="text-sm text-muted-foreground mt-2">Order #{orderId}</p>
          )}
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <Star
                className={cn(
                  'w-12 h-12 transition-colors',
                  (hoveredRating || rating) >= star
                    ? 'fill-accent text-accent'
                    : 'fill-none text-muted stroke-muted-foreground'
                )}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="text-center text-sm text-muted-foreground animate-fade-in">
            {rating === 1 && "We're sorry to hear that. Please tell us more."}
            {rating === 2 && "We appreciate your feedback. How can we improve?"}
            {rating === 3 && "Thank you! What could we do better?"}
            {rating === 4 && "Great! We'd love to hear more."}
            {rating === 5 && "Awesome! We're glad you enjoyed it!"}
          </div>
        )}

        {/* Feedback Text */}
        <div>
          <Label htmlFor="feedback" className="text-base">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback"
            placeholder="Tell us more about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-2 min-h-32 text-base"
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" size="lg" className="w-full h-14 text-base">
          Submit Feedback
        </Button>
      </form>
    </Card>
  );
};
