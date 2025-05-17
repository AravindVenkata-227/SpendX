
"use client";

import { useState, useEffect } from 'react';
import SummaryItemCard from "@/components/dashboard/summary-item-card";
import { ShieldCheck, PiggyBank, TrendingDown, Activity, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { calculateFinancialHealth, type FinancialHealthOutput } from '@/ai/flows/financial-health-flow';
import { getMonthlySummary, type MonthlySummary } from '@/services/transactionService';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function SummarySection() {
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthOutput | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const { toast } = useToast();

  // Placeholder data for "Upcoming Bills" - this would require its own data source and logic
  const upcomingBills = 3;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Reset states if user logs out
        setFinancialHealth(null);
        setMonthlySummary(null);
        setIsLoadingHealth(false);
        setIsLoadingSummary(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getFinancialHealth = async () => {
      if (!currentUser) {
        setIsLoadingHealth(false);
        return;
      }
      setIsLoadingHealth(true);
      try {
        const mockFinancialSummary = "User has a steady income, saves about 15% of it. Has some credit card debt but is managing payments. Spends moderately on non-essentials. Has a small emergency fund.";
        const result = await calculateFinancialHealth({ financialSummary: mockFinancialSummary });
        setFinancialHealth(result);
      } catch (error) {
        console.error("Error fetching financial health:", error);
        toast({
          title: "Error",
          description: "Could not fetch financial health score.",
          variant: "destructive",
        });
        setFinancialHealth({ score: 0, explanation: "Error loading score."});
      } finally {
        setIsLoadingHealth(false);
      }
    };

    const fetchMonthlySummary = async () => {
      if (!currentUser) {
        setIsLoadingSummary(false);
        return;
      }
      setIsLoadingSummary(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // JavaScript months are 0-indexed
        const summary = await getMonthlySummary(currentUser.uid, year, month);
        setMonthlySummary(summary);
      } catch (error: any) {
        console.error("Error fetching monthly summary:", error);
        toast({
          title: "Summary Error",
          description: error.message || "Could not fetch monthly financial summary.",
          variant: "destructive",
        });
        setMonthlySummary({ totalIncome: 0, totalExpenses: 0, netSavings: 0 });
      } finally {
        setIsLoadingSummary(false);
      }
    };
    
    if (currentUser) {
      getFinancialHealth();
      fetchMonthlySummary();
    } else {
      // Ensure loaders are off if no user
      setIsLoadingHealth(false);
      setIsLoadingSummary(false);
    }
  }, [currentUser, toast]);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString()}`;
  };
  
  const renderSummaryValue = (value: number | undefined | null, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (!currentUser) return 'N/A'; // Or some other placeholder if not logged in
    return formatCurrency(value);
  };


  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Financial Summary
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryItemCard
          title="Financial Health"
          value={isLoadingHealth || !currentUser ? <Loader2 className="h-5 w-5 animate-spin" /> : `${financialHealth?.score || 0}/100`}
          icon={ShieldCheck}
          iconColor="text-green-500"
          description={isLoadingHealth || !currentUser ? "Calculating..." : financialHealth?.explanation || "Based on your habits"}
        />
        <SummaryItemCard
          title="Total Income (Month)"
          value={renderSummaryValue(monthlySummary?.totalIncome, isLoadingSummary)}
          icon={TrendingUp}
          iconColor="text-green-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : "Current month's income"}
        />
        <SummaryItemCard
          title="Total Spent (Month)"
          value={renderSummaryValue(monthlySummary?.totalExpenses, isLoadingSummary)}
          icon={TrendingDown}
          iconColor="text-red-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : "Current month's expenses"}
        />
        <SummaryItemCard
          title="Net Saved (Month)"
          value={renderSummaryValue(monthlySummary?.netSavings, isLoadingSummary)}
          icon={PiggyBank} // Or DollarSign if preferred
          iconColor="text-blue-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : "Income minus expenses"}
        />
      </div>
    </section>
  );
}
