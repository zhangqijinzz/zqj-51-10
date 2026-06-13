import TopNav from '@/components/TopNav';
import StallSetup from '@/components/stall-setup/StallSetup';
import PricingCalc from '@/components/PricingCalc';
import TrafficScript from '@/components/TrafficScript';
import ReviewPanel from '@/components/ReviewPanel';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { activeTab } = useAppStore();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopNav />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'setup' && <StallSetup />}
        {activeTab === 'pricing' && <PricingCalc />}
        {activeTab === 'traffic' && <TrafficScript />}
        {activeTab === 'review' && <ReviewPanel />}
      </main>
    </div>
  );
}
