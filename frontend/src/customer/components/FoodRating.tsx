import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import axios from "axios";

interface FoodRatingProps {
  orderId: string;
  orderNumber: string;
  onRatingSubmitted?: () => void;
}

export const FoodRating = ({
  orderId,
  orderNumber,
  onRatingSubmitted,
}: FoodRatingProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await axios.post("/api/ratings", {
        orderId,
        rating,
        review: review.trim(),
        customerId: localStorage.getItem("customerId") || null,
        customerPhone: localStorage.getItem("customerPhone") || null,
      }, {
        headers: {
          'x-restaurant-slug': window.location.pathname.split('/')[2] // Reliable way to get slug from URL: /menu/:slug/...
        }
      });

      if (response.data.success) {
        toast.success("Thank you for your feedback! 🎉");
        setIsSubmitted(true);
        onRatingSubmitted?.();
      }
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      const message =
        error.response?.data?.message || "Failed to submit rating";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Sparkles className="w-16 h-16 mx-auto text-green-600 mb-4" />
          </motion.div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h3>
          <p className="text-green-700">
            Your feedback helps us serve you better
          </p>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h3 className="text-2xl font-bold text-gray-900">
                Rate Your Food
              </h3>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm text-gray-600">
              How was your experience with order #{orderNumber}?
            </p>
          </div>

          {/* Star Rating */}
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= (hoveredRating || rating);

              return (
                <motion.button
                  key={star}
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    animate={{
                      rotate: isActive ? [0, -10, 10, -10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Star
                      className={cn(
                        "w-12 h-12 transition-colors duration-200",
                        isActive
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      )}
                    />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {/* Rating Label */}
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-amber-700">
                {rating === 1 && "Poor"}
                {rating === 2 && "Could be better"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great!"}
                {rating === 5 && "Excellent! ⭐"}
              </p>
            </motion.div>
          )}

          {/* Review Textarea */}
          <div className="space-y-2">
            <label
              htmlFor="review"
              className="text-sm font-medium text-gray-700"
            >
              Share your thoughts (optional)
            </label>
            <Textarea
              id="review"
              placeholder="Tell us about your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px] resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {review.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Star className="w-5 h-5" />
                </motion.div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
