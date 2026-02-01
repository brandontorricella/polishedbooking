import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import polishedLogo from '@/assets/polished-logo.png';

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
      className="fixed inset-0 bg-midnight z-[9999] flex items-center justify-center"
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
          className="w-44 h-auto"
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
