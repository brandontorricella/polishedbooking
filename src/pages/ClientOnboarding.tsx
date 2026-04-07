import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { SERVICE_CATEGORIES, getCategoriesByGroup, GROUP_LABELS_ES } from '@/constants/categories';

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  const [profile, setProfile] = useState({
    service_interests: [] as string[],
    setting_preference: '' as string,
    budget_preference: '' as string,
    notification_preference: 'email',
  });

  const totalSteps = 5;

  const serviceCategories = SERVICE_CATEGORIES;

  const handleLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        await updateProfile({
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude,
        });
      } catch { /* user denied */ }
    }
    setStep(2);
  };

  const toggleService = (id: string) => {
    setProfile(prev => ({
      ...prev,
      service_interests: prev.service_interests.includes(id)
        ? prev.service_interests.filter(s => s !== id)
        : [...prev.service_interests, id],
    }));
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    await updateProfile({
      service_interests: profile.service_interests,
      setting_preference: (profile.setting_preference || 'both') as 'in_studio' | 'mobile' | 'both',
      budget_preference: profile.budget_preference || 'no_preference',
      onboarding_completed: true,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
    } as any);
    setIsUpdating(false);
    navigate('/');
  };

  if (!user) {
    navigate('/auth?mode=signup');
    return null;
  }

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
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn("w-8 h-1.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">Step {step} of {totalSteps}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Step 1 — Location */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full text-center">
              <div className="text-5xl mb-6">📍</div>
              <h1 className="font-display text-3xl font-bold mb-3">Where are you located?</h1>
              <p className="text-muted-foreground mb-8">We'll show you businesses near you</p>
              <Input
                value={locationInput}
                onChange={e => setLocationInput(e.target.value)}
                placeholder="City or ZIP code"
                className="h-12 mb-4"
              />
              <Button onClick={handleLocationPermission} variant="outline" className="w-full h-12 mb-4">
                <MapPin className="w-4 h-4 mr-2" /> Use My Location
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Skip for now</Button>
                <Button onClick={() => setStep(2)} className="flex-1 bg-gradient-primary hover:opacity-90">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Service Interests */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-2xl w-full text-center">
              <div className="text-5xl mb-6">✨</div>
              <h1 className="font-display text-3xl font-bold mb-3">What services are you interested in?</h1>
              <p className="text-muted-foreground mb-6">Select all that apply — we'll personalize your experience</p>
              <div className="space-y-5 mb-6 text-left max-h-[50vh] overflow-y-auto pr-2">
                {Object.entries(getCategoriesByGroup()).map(([group, cats]) => (
                  <div key={group}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-2">{group}</h3>
                    <div className="flex flex-wrap gap-2">
                      {cats.map(cat => {
                        const selected = profile.service_interests.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleService(cat.id)}
                            className={cn(
                              "px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all",
                              selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                            )}
                          >
                            {selected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4">{profile.service_interests.length} selected</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Service Setting */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full text-center">
              <div className="text-5xl mb-6">🏠</div>
              <h1 className="font-display text-3xl font-bold mb-3">Where do you prefer your services?</h1>
              <div className="space-y-3 mb-8">
                {[
                  { value: 'in_studio', label: 'At the salon/studio', emoji: '💇' },
                  { value: 'mobile', label: 'At my home/location', emoji: '🚗' },
                  { value: 'both', label: 'Either works for me', emoji: '✅' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, setting_preference: opt.value })}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      profile.setting_preference === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(4)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Budget */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full text-center">
              <div className="text-5xl mb-6">💰</div>
              <h1 className="font-display text-3xl font-bold mb-3">What's your typical budget per visit?</h1>
              <div className="space-y-3 mb-8">
                {[
                  { value: 'under_50', label: 'Under $50', emoji: '💵' },
                  { value: '50_100', label: '$50 – $100', emoji: '💵💵' },
                  { value: '100_200', label: '$100 – $200', emoji: '💵💵💵' },
                  { value: 'over_200', label: '$200+', emoji: '💎' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setProfile({ ...profile, budget_preference: opt.value })}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      profile.budget_preference === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 5 — Complete */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold mb-4">You're All Set! 🎉</h1>
              <p className="text-muted-foreground mb-8">
                Start exploring beauty professionals near you. Book appointments, save favorites, and get exclusive deals.
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
                      🎉 Start Exploring <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setStep(4)} className="w-full text-muted-foreground">
                  <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
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
