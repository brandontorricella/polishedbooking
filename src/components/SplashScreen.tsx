import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import polishedLogo from '@/assets/logo-transparent.png';

const SPLASH_SHOWN_KEY = 'polished_splash_shown';

interface SplashScreenProps {
  onComplete: () => void;
  isInitialized?: boolean;
}

export const SplashScreen = ({ onComplete, isInitialized = true }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Minimum display time for branding impact
    const timer = setTimeout(() => {
      if (isInitialized) {
        setFadeOut(true);
        // Mark as shown for future visits
        localStorage.setItem(SPLASH_SHOWN_KEY, 'true');
        // Allow fade animation to complete
        setTimeout(onComplete, 500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete, isInitialized]);

  // If initialized but timer hasn't completed yet, wait
  useEffect(() => {
    if (fadeOut && !isInitialized) {
      // Wait for initialization
    } else if (fadeOut && isInitialized) {
      setTimeout(onComplete, 500);
    }
  }, [isInitialized, fadeOut, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: '#000000' }}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeIn' }}
      >
        <motion.img
          src={polishedLogo}
          alt="Polished"
          className="w-[180px] h-auto"
          animate={{ 
            opacity: [1, 0.8, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// Helper to check if splash should be shown
export const shouldShowSplash = (): boolean => {
  return !localStorage.getItem(SPLASH_SHOWN_KEY);
};
