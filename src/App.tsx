import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SubscriptionProvider } from "@/hooks/useSuperwall";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import Pricing from "./pages/Pricing";
import HelpCenter from "./pages/HelpCenter";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/business" element={<Business />} />
                  <Route path="/business/:id" element={<BusinessProfile />} />
                  <Route path="/business/pricing" element={<Pricing />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/help" element={<HelpCenter />} />
                  
                  {/* Customer-protected routes */}
                  <Route path="/favorites" element={
                    <ProtectedRoute requiredType="customer">
                      <Favorites />
                    </ProtectedRoute>
                  } />
                  <Route path="/bookings" element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <ClientOnboarding />
                    </ProtectedRoute>
                  } />

                  {/* Business-protected routes */}
                  <Route path="/business/analytics" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessAnalytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/onboarding" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessOnboarding />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
