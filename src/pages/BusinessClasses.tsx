import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ClassManager } from '@/components/classes/ClassManager';
import { FeatureGate } from '@/components/subscription/FeatureGate';

const BusinessClasses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <FeatureGate feature="group_class_booking" requiredTier="pro">
          <ClassManager />
        </FeatureGate>
      </main>
      <BottomNav />
    </div>
  );
};

export default BusinessClasses;
