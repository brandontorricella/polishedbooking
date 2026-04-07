import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AccountTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfter?: string;
}

export const AccountTypeModal = ({ open, onOpenChange, redirectAfter = '/' }: AccountTypeModalProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold">Join Polished</h2>
            <p className="text-muted-foreground mt-1">How would you like to use Polished?</p>
          </div>

          <div className="space-y-3">
            {/* Client option */}
            <button
              onClick={() => { onOpenChange(false); navigate('/auth?mode=signup&role=client'); }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary/50 transition-all text-left group"
            >
              <span className="text-3xl">💆</span>
              <div className="flex-1">
                <p className="font-semibold text-lg">I'm a Client</p>
                <p className="text-sm text-muted-foreground">Book beauty & wellness appointments, save favorites, earn loyalty points</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {/* Business option */}
            <button
              onClick={() => { onOpenChange(false); navigate('/business/onboarding'); }}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:border-primary transition-all text-left group"
            >
              <span className="text-3xl">✂️</span>
              <div className="flex-1">
                <p className="font-semibold text-lg">I'm a Business</p>
                <p className="text-sm text-muted-foreground">List your salon, spa, studio, or wellness practice</p>
                <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 1 month free — no credit card required to start
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button 
                onClick={() => { onOpenChange(false); navigate('/auth?mode=login'); }}
                className="text-primary hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
