import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SplashScreen, shouldShowSplash } from "@/components/SplashScreen";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Bookings from "./pages/Bookings";
import Messages from "./pages/Messages";
import Business from "./pages/Business";
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessProfile from "./pages/BusinessProfile";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import ClientOnboarding from "./pages/ClientOnboarding";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => shouldShowSplash());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize app
    const initialize = async () => {
      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsInitialized(true);
    };
    initialize();
  }, []);

  const handleSplashComplete = () => {
    if (isInitialized) {
      setShowSplash(false);
    }
  };

  if (showSplash) {
    return (
      <SplashScreen 
        onComplete={handleSplashComplete} 
        isInitialized={isInitialized} 
      />
    );
  }

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/business" element={<Business />} />
              <Route path="/business/analytics" element={<BusinessAnalytics />} />
              <Route path="/business/:id" element={<BusinessProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/onboarding" element={<ClientOnboarding />} />
              <Route path="/business/onboarding" element={<BusinessOnboarding />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
