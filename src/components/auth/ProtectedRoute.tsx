import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccountType, AccountType } from '@/hooks/useAccountType';
import { LogoSpinner } from '@/components/ui/LogoSpinner';
import { saveIntendedDestination } from '@/components/auth/AuthGate';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType?: 'customer' | 'business';
}

export const ProtectedRoute = ({ children, requiredType }: ProtectedRouteProps) => {
  const { accountType, loading } = useAccountType();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LogoSpinner size="lg" />
      </div>
    );
  }

  if (accountType === 'guest') {
    saveIntendedDestination(location.pathname);
    return <Navigate to="/auth" replace />;
  }

  if (requiredType === 'business' && accountType !== 'business') {
    return <Navigate to="/" replace />;
  }

  if (requiredType === 'customer' && accountType === 'business') {
    return <Navigate to="/business/analytics" replace />;
  }

  return <>{children}</>;
};
