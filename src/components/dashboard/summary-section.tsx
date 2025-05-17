
"use client";

import { useState, useEffect, useCallback } from 'react';
import SummaryItemCard from "@/components/dashboard/summary-item-card";
import { ShieldCheck, PiggyBank, TrendingDown, Activity, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { calculateFinancialHealth, type FinancialHealthOutput } from '@/ai/flows/financial-health-flow';
import { getMonthlySummary, type MonthlySummary } from '@/services/transactionService';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface SummarySectionProps {
  refreshTrigger: number;
}

export default function SummarySection({ refreshTrigger }: SummarySectionProps) {
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthOutput | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const { toast } = useToast();

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

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString()}`;
  };

  const fetchAllSummaries = useCallback(async (user: User) => {
    setIsLoadingSummary(true);
    setIsLoadingHealth(true); // Start loading health score as well

    let currentMonthlySummary: MonthlySummary | null = null;
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      currentMonthlySummary = await getMonthlySummary(user.uid, year, month);
      setMonthlySummary(currentMonthlySummary);
    } catch (error: any) {
      console.error("Error fetching monthly summary:", error);
      toast({
        title: "Summary Error",
        description: error.message || "Could not fetch monthly financial summary.",
        variant: "destructive",
      });
      setMonthlySummary({ totalIncome: 0, totalExpenses: 0, netSavings: 0 }); // Set default on error
      currentMonthlySummary = { totalIncome: 0, totalExpenses: 0, netSavings: 0 }; // Use default for AI
    } finally {
      setIsLoadingSummary(false);
    }

    // Now generate financial health score based on fetched or default summary
    try {
      let dynamicFinancialSummary = "User's current month financial overview:\n";
      if (currentMonthlySummary) {
        dynamicFinancialSummary += `- Total Income: ${formatCurrency(currentMonthlySummary.totalIncome)}\n`;
        dynamicFinancialSummary += `- Total Expenses: ${formatCurrency(currentMonthlySummary.totalExpenses)}\n`;
        dynamicFinancialSummary += `- Net Savings: ${formatCurrency(currentMonthlySummary.netSavings)}\n`;

        if (currentMonthlySummary.netSavings > 0) {
          dynamicFinancialSummary += `The user is saving money this month.`;
          if (currentMonthlySummary.totalIncome > 0) {
            const savingsRate = (currentMonthlySummary.netSavings / currentMonthlySummary.totalIncome) * 100;
            dynamicFinancialSummary += ` Their current monthly savings rate is approximately ${savingsRate.toFixed(0)}%.`;
          }
        } else if (currentMonthlySummary.netSavings < 0) {
          dynamicFinancialSummary += `The user is spending more than their income this month.`;
        } else {
          dynamicFinancialSummary += `The user's income and expenses are balanced this month.`;
        }
      } else {
        dynamicFinancialSummary = "Not enough transaction data available for a detailed financial summary this month. Please add more transactions.";
      }
      
      // Add a note about placeholder nature if data is minimal
      if (currentMonthlySummary?.totalIncome === 0 && currentMonthlySummary?.totalExpenses === 0) {
        dynamicFinancialSummary += "\n(Note: Score based on limited or no transaction data for the current month.)";
      }


      const result = await calculateFinancialHealth({ financialSummary: dynamicFinancialSummary });
      setFinancialHealth(result);
    } catch (error) {
      console.error("Error fetching financial health:", error);
      toast({
        title: "AI Health Score Error",
        description: "Could not fetch AI financial health score.",
        variant: "destructive",
      });
      setFinancialHealth({ score: 0, explanation: "Error loading score." });
    } finally {
      setIsLoadingHealth(false);
    }
  }, [toast]); // formatCurrency is stable, no need to include

  useEffect(() => {
    if (currentUser) {
      fetchAllSummaries(currentUser);
    } else {
      setIsLoadingSummary(false);
      setIsLoadingHealth(false);
      setMonthlySummary(null);
      setFinancialHealth(null);
    }
  }, [currentUser, fetchAllSummaries, refreshTrigger]); // Add refreshTrigger here
  
  const renderSummaryValue = (value: number | undefined | null, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (!currentUser) return 'N/A';
    return formatCurrency(value);
  };

  const getHealthDescription = () => {
    if (isLoadingHealth) return "Calculating...";
    if (!currentUser) return "Log in to view";
    return financialHealth?.explanation || "Based on your habits";
  }

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
          description={getHealthDescription()}
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
          icon={PiggyBank}
          iconColor="text-blue-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : "Income minus expenses"}
        />
      </div>
    </section>
  );
}
