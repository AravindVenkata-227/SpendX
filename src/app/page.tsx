import Header from '@/components/layout/header';
import SummarySection from '@/components/dashboard/summary-section';
import ChartsSection from '@/components/dashboard/charts-section';
import GoalsSection from '@/components/dashboard/goals-section';
import TransactionsSection from '@/components/dashboard/transactions-section';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <SummarySection />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ChartsSection />
          </div>
          <div className="lg:col-span-2">
            <GoalsSection />
          </div>
        </div>
        <TransactionsSection />
      </main>
      <footer className="py-6 px-4 md:px-6 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinTrack AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
