import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LocationPermissionModalProps {
  open: boolean;
  onClose: () => void;
  onLocationGranted: (coords: { lat: number; lng: number }) => void;
  onManualLocation: (location: { lat: number; lng: number; city: string; state: string }) => void;
}

export const LocationPermissionModal = ({
  open,
  onClose,
  onLocationGranted,
  onManualLocation,
}: LocationPermissionModalProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAllowLocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      setIsLoading(false);
      setShowManualInput(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationGranted({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
        onClose();
      },
      (err) => {
        setError('Location access denied. Please enter your location manually.');
        setIsLoading(false);
        setShowManualInput(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZipCodeSubmit = async () => {
    if (!zipCode || zipCode.length < 5) {
      setError('Please enter a valid ZIP code');
      return;
    }

    setIsLoading(true);
    setError('');

    // Mock geocoding - in production, use a real geocoding API
    try {
      // Simulated coordinates for common LA area zip codes
      const mockCoords: Record<string, { lat: number; lng: number; city: string; state: string }> = {
        '90001': { lat: 33.9425, lng: -118.2551, city: 'Los Angeles', state: 'CA' },
        '90002': { lat: 33.9490, lng: -118.2465, city: 'Los Angeles', state: 'CA' },
        '90210': { lat: 34.0901, lng: -118.4065, city: 'Beverly Hills', state: 'CA' },
        '90401': { lat: 34.0195, lng: -118.4912, city: 'Santa Monica', state: 'CA' },
        '90301': { lat: 33.9617, lng: -118.3531, city: 'Inglewood', state: 'CA' },
      };

      // Default to LA center if zip not found
      const location = mockCoords[zipCode] || { 
        lat: 34.0522, 
        lng: -118.2437, 
        city: 'Los Angeles', 
        state: 'CA' 
      };

      onManualLocation(location);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError('Unable to find location. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {showManualInput ? 'Enter Your Location' : 'Enable Location'}
          </DialogTitle>
          <DialogDescription>
            {showManualInput
              ? 'Enter your ZIP code to find beauty services near you.'
              : 'Allow Polished to use your location to find beauty services near you.'}
          </DialogDescription>
        </DialogHeader>

        {!showManualInput ? (
          <div className="space-y-4 pt-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
            </motion.div>

            <Button
              onClick={handleAllowLocation}
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? 'Requesting...' : 'Allow Location Access'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowManualInput(true)}
              className="w-full"
            >
              Enter Location Manually
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your location is only used to show nearby businesses and is never shared.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter ZIP code (e.g., 90210)"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.slice(0, 5))}
                  className="pl-10"
                  type="text"
                  pattern="[0-9]*"
                  maxLength={5}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              onClick={handleZipCodeSubmit}
              className="w-full bg-gradient-primary hover:opacity-90"
              disabled={isLoading || zipCode.length < 5}
            >
              {isLoading ? 'Finding...' : 'Find Services'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowManualInput(false)}
              className="w-full"
            >
              Try Location Access Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
