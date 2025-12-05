import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';

interface KitchenSettingsProps {
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
}

export const KitchenSettings = ({ soundEnabled, onSoundToggle }: KitchenSettingsProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Kitchen Settings</SheetTitle>
          <SheetDescription>
            Configure notification preferences
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Sound Notifications */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-green-500" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-400" />
              )}
              <div className="space-y-1">
                <Label htmlFor="sound-notifications" className="text-sm font-medium">
                  Sound Notifications
                </Label>
                <p className="text-xs text-gray-500">
                  Play sound when new orders arrive
                </p>
              </div>
            </div>
            <Switch
              id="sound-notifications"
              checked={soundEnabled}
              onCheckedChange={onSoundToggle}
            />
          </div>

          {/* Visual Alerts Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Visual Alerts
                </p>
                <p className="text-xs text-blue-700">
                  Pop-up notifications are always enabled and cannot be disabled. 
                  They ensure you never miss an order.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Tip: Even with sound disabled, you'll receive visual pop-up notifications 
              that must be acknowledged before continuing work.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
