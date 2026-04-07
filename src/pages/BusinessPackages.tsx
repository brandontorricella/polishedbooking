import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackageManager } from '@/components/packages/PackageManager';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGate } from '@/components/subscription/FeatureGate';

const BusinessPackages = () => {
  const { hasFeature } = useFeatureAccess();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {hasFeature('service_packages') ? (
            <PackageManager />
          ) : (
            <FeatureGate feature="service_packages" />
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default BusinessPackages;
