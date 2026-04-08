import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { IntakeFormManager } from '@/components/intake/IntakeFormManager';

const BusinessIntakeForms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24">
        <IntakeFormManager />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default BusinessIntakeForms;
