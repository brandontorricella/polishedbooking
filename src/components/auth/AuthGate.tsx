import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AuthGateProps {
  children: ReactNode;
  requiredRole?: 'client' | 'business';
  redirectPath?: string;
}

// Save intended destination for post-auth redirect
export const saveIntendedDestination = (path: string) => {
  sessionStorage.setItem('intendedDestination', path);
};

export const getIntendedDestination = () => {
  return sessionStorage.getItem('intendedDestination');
};

export const clearIntendedDestination = () => {
  sessionStorage.removeItem('intendedDestination');
};

// Consumer route protection - only allows client accounts
export const ConsumerRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      saveIntendedDestination(window.location.pathname);
      navigate('/auth?mode=login&role=client');
      return;
    }

    if (profile?.role === 'business') {
      toast({
        title: 'Access Denied',
        description: 'Business accounts cannot access consumer discovery. Please use a personal account.',
        variant: 'destructive',
      });
      navigate('/business');
      return;
    }
  }, [user, profile, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
    );
  }

  if (!user || profile?.role === 'business') {
    return null;
  }

  return <>{children}</>;
};

// Business route protection - only allows business accounts
export const BusinessRoute = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      saveIntendedDestination(window.location.pathname);
      navigate('/auth?mode=login&role=business');
      return;
    }

    if (profile?.role === 'client') {
      toast({
        title: 'Access Denied',
        description: 'This area is for business accounts only.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
  }, [user, profile, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
    );
  }

  if (!user || profile?.role === 'client') {
    return null;
  }

  return <>{children}</>;
};

// Generic auth gate component
export const AuthGate = ({ children, requiredRole, redirectPath = '/auth' }: AuthGateProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      saveIntendedDestination(window.location.pathname);
      navigate(redirectPath);
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      toast({
        title: 'Access Denied',
        description: `This area requires a ${requiredRole} account.`,
        variant: 'destructive',
      });
      navigate('/');
      return;
    }
  }, [user, profile, loading, navigate, toast, requiredRole, redirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
    );
  }

  if (!user || (requiredRole && profile?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};
