import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { MembershipManager } from '@/components/memberships/MembershipManager';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { LockedFeaturePage } from '@/components/subscription/FeatureGate';

const BusinessMemberships = () => {
  const { hasFeature } = useFeatureAccess();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {hasFeature('membership_management') ? (
            <MembershipManager />
          ) : (
            <LockedFeaturePage
              icon={<span className="text-2xl">💎</span>}
              title="Membership Management"
              description="Offer recurring monthly or weekly membership plans."
              requiredTier="pro"
              benefits={[
                'Create weekly or monthly plans',
                'Set session limits or unlimited access',
                'Manage all members in one place',
                'Automatic recurring billing',
              ]}
            />
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default BusinessMemberships;
