import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SubscriptionProvider } from "@/hooks/useSuperwall";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import Bookings from "./pages/Bookings";
import Messages from "./pages/Messages";
import Business from "./pages/Business";
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessSchedule from "./pages/BusinessSchedule";
import BusinessProfile from "./pages/BusinessProfile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import ClientOnboarding from "./pages/ClientOnboarding";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import BusinessSignup from "./pages/BusinessSignup";
import GivesBack from "./pages/GivesBack";
import ForBusiness from "./pages/ForBusiness";
import HelpCenter from "./pages/HelpCenter";
import BusinessPackages from "./pages/BusinessPackages";
import BusinessMemberships from "./pages/BusinessMemberships";
import BusinessIntakeForms from "./pages/BusinessIntakeForms";
import BusinessClasses from "./pages/BusinessClasses";
import BusinessEmbedWidget from "./pages/BusinessEmbedWidget";
import BusinessCommissions from "./pages/BusinessCommissions";
import BusinessCustomReports from "./pages/BusinessCustomReports";
import BusinessMigration from "./pages/BusinessMigration";
import BusinessTemplates from "./pages/BusinessTemplates";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";

const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminRevenue = lazy(() => import("./pages/admin/AdminRevenue"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/business" element={<Business />} />
                  <Route path="/business/:id" element={<BusinessProfile />} />
                  <Route path="/business/pricing" element={<Pricing />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/signup/business" element={<BusinessSignup />} />
                  <Route path="/business/signup" element={<BusinessSignup />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/gives-back" element={<GivesBack />} />
                  <Route path="/for-business" element={<ForBusiness />} />
                  
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
                  <Route path="/business/schedule" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessSchedule />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/onboarding" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessOnboarding />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/packages" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessPackages />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/memberships" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessMemberships />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/intake-forms" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessIntakeForms />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/classes" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessClasses />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/embed-widget" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessEmbedWidget />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/commissions" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessCommissions />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/custom-reports" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessCustomReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/migration" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessMigration />
                    </ProtectedRoute>
                  } />
                  <Route path="/business/templates" element={
                    <ProtectedRoute requiredType="business">
                      <BusinessTemplates />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminRoute><Suspense fallback={null}><AdminOverview /></Suspense></AdminRoute>} />
                  <Route path="/admin/businesses" element={<AdminRoute><Suspense fallback={null}><AdminBusinesses /></Suspense></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><Suspense fallback={null}><AdminUsers /></Suspense></AdminRoute>} />
                  <Route path="/admin/subscriptions" element={<AdminRoute><Suspense fallback={null}><AdminSubscriptions /></Suspense></AdminRoute>} />
                  <Route path="/admin/revenue" element={<AdminRoute><Suspense fallback={null}><AdminRevenue /></Suspense></AdminRoute>} />
                  <Route path="/admin/reviews" element={<AdminRoute><Suspense fallback={null}><AdminReviews /></Suspense></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><Suspense fallback={null}><AdminSettings /></Suspense></AdminRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
