
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/layout/header';
import SummarySection from '@/components/dashboard/summary-section';
import ChartsSection from '@/components/dashboard/charts-section';
import GoalsSection from '@/components/dashboard/goals-section';
import TransactionsSection from '@/components/dashboard/transactions-section';
import FinancialInsightsCard from '@/components/dashboard/financial-insights-card';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        router.push('/login'); // Redirect to login if not authenticated
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (isLoadingAuth) { // Show loader if still checking auth state or if no user (before redirect kicks in)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  if (!currentUser) { // This case handles the brief moment before redirection or if redirection is slow.
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Redirecting to login...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <SummarySection />
        <FinancialInsightsCard />
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
          {currentYear !== null ? `© ${currentYear} FinTrack AI. All rights reserved.` : '© FinTrack AI. All rights reserved.'}
        </p>
      </footer>
    </div>
  );
}
