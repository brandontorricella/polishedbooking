import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, UserPlus } from 'lucide-react';
import { saveIntendedDestination } from '@/components/auth/AuthGate';

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  redirectTo?: string;
}

export const AuthPromptModal = ({
  open,
  onOpenChange,
  message = 'Sign up to access this feature',
  redirectTo,
}: AuthPromptModalProps) => {
  const handleClick = () => {
    if (redirectTo) saveIntendedDestination(redirectTo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="font-display text-2xl">Join Polished</DialogTitle>
          <DialogDescription className="text-base">{message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Link to="/auth?mode=signup" onClick={handleClick}>
            <Button className="w-full bg-gradient-primary hover:opacity-90 h-12">
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up Free
            </Button>
          </Link>
          <Link to="/auth?mode=login" onClick={handleClick}>
            <Button variant="outline" className="w-full h-12">
              <LogIn className="w-5 h-5 mr-2" />
              Log In
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Create an account in 30 seconds
        </p>
      </DialogContent>
    </Dialog>
  );
};
