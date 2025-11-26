import { useState } from 'react';
import { MessageCircle, Check } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { Alert, AlertDescription } from '@/shared/ui/alert';

interface WhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phoneNumber: string) => void;
}

export const WhatsAppModal = ({ open, onOpenChange, onSubmit }: WhatsAppModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { loading, error, success, validatePhoneNumber, resetState } = useWhatsApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    onSubmit(phoneNumber);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
      setPhoneNumber('');
    }
    onOpenChange(newOpen);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as: (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">Get Order Updates</DialogTitle>
          <DialogDescription className="text-center">
            Receive real-time updates about your order on WhatsApp
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone" className="text-base">
              WhatsApp Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="h-12 text-base mt-2"
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              We'll send you updates when your order is being prepared, ready, and served
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-success/10 border-success text-success-foreground">
              <Check className="h-4 w-4" />
              <AlertDescription>Successfully subscribed to WhatsApp updates!</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1 h-12"
              disabled={loading}
            >
              Skip
            </Button>
            <Button type="submit" className="flex-1 h-12" disabled={loading}>
              {loading ? 'Submitting...' : 'Subscribe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
