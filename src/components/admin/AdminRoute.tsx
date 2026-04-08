import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { LogoSpinner } from '@/components/ui/LogoSpinner';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <LogoSpinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
