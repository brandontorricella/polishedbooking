import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Check, 
  Scissors, 
  Heart,
  Palette,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const serviceCategories = [
  { id: 'hair_styling', name: 'Hair Styling', icon: Scissors },
  { id: 'nails', name: 'Nails', icon: Sparkles },
  { id: 'makeup', name: 'Makeup', icon: Palette },
  { id: 'lashes', name: 'Lashes', icon: Star },
  { id: 'facials', name: 'Skincare', icon: Heart },
  { id: 'massage', name: 'Massage', icon: Heart },
];

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signup');
    }
  }, [user, navigate]);

  const totalSteps = 3;

  const handleLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        setLocationGranted(true);
        
        // Update profile with location
        await updateProfile({
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
        });
      } catch (error) {
        console.log('Location permission denied');
      }
    }
    setStep(2);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    
    await updateProfile({
      service_interests: selectedServices,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
    });

    setIsUpdating(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Polished</span>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-1.5 rounded-full transition-colors",
                i + 1 <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Welcome & Location */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
                <MapPin className="w-10 h-10 text-primary" />
              </div>

              <h1 className="font-display text-3xl font-bold mb-4">
                Find Beauty Near You
              </h1>
              <p className="text-muted-foreground mb-8">
                Allow location access to discover talented beauty professionals in your area. 
                You can always change this later in settings.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={handleLocationPermission}
                  className="w-full h-14 bg-gradient-primary hover:opacity-90 text-lg rounded-xl"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  Enable Location
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(2)}
                  className="w-full text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Service Interests */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg w-full"
            >
              <h1 className="font-display text-3xl font-bold text-center mb-4">
                What are you looking for?
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Select the services you're interested in. We'll personalize your experience.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {serviceCategories.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);
                  
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all text-left",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                        isSelected ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <p className="font-medium">{service.name}</p>
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary absolute top-3 right-3" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  className="flex-1 h-14 bg-gradient-primary hover:opacity-90 rounded-xl"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>

              <h1 className="font-display text-3xl font-bold mb-4">
                You're All Set!
              </h1>
              <p className="text-muted-foreground mb-8">
                Start exploring beauty professionals near you. Book appointments, 
                save favorites, and get exclusive deals.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={handleComplete}
                  disabled={isUpdating}
                  className="w-full h-14 bg-gradient-primary hover:opacity-90 text-lg rounded-xl"
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-5 h-5" />
                      </motion.span>
                      Setting up...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Start Exploring
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(2)}
                  className="w-full text-muted-foreground"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Go Back
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientOnboarding;
