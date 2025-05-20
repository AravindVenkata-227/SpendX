
"use client";

import { useState, useEffect, useCallback } from 'react';
import SummaryItemCard from "@/components/dashboard/summary-item-card";
import { ShieldCheck, PiggyBank, TrendingDown, Activity, Loader2, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"; // Added AlertTriangle
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
  const [healthError, setHealthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setFinancialHealth(null);
        setMonthlySummary(null);
        setIsLoadingHealth(false);
        setIsLoadingSummary(false);
        setHealthError(null);
        setSummaryError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString()}`;
  };

  const fetchAllSummaries = useCallback(async (user: User) => {
    if (!user.uid) {
        toast({ title: "Authentication Error", description: "User ID missing for summary.", variant: "destructive" });
        setIsLoadingSummary(false);
        setIsLoadingHealth(false);
        setSummaryError("User ID missing.");
        setHealthError("User ID missing.");
        return;
    }
    console.log(`Fetching summaries for userId: ${user.uid}`);
    setIsLoadingSummary(true);
    setIsLoadingHealth(true);
    setSummaryError(null);
    setHealthError(null);

    let currentMonthlySummary: MonthlySummary | null = null;
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      currentMonthlySummary = await getMonthlySummary(user.uid, year, month);
      setMonthlySummary(currentMonthlySummary);
    } catch (error: any) {
      console.error("Error fetching monthly summary:", error);
      const errorMessage = error.message || "Could not fetch monthly financial summary.";
      toast({
        title: "Failed to Load Monthly Summary",
        description: errorMessage,
        variant: "destructive",
      });
      setMonthlySummary(null);
      setSummaryError(errorMessage);
      currentMonthlySummary = null; // Ensure it's null for health score calculation if fetch fails
    } finally {
      setIsLoadingSummary(false);
    }

    // Proceed to calculate financial health even if summary fetch failed, using a default/empty summary
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

      if (currentMonthlySummary?.totalIncome === 0 && currentMonthlySummary?.totalExpenses === 0) {
        dynamicFinancialSummary += "\n(Note: Score based on limited or no transaction data for the current month.)";
      }

      const result = await calculateFinancialHealth({ financialSummary: dynamicFinancialSummary });
      setFinancialHealth(result);
    } catch (error:any) {
      console.error("Error fetching financial health:", error);
      const errorMessage = error.message || "Could not fetch AI financial health score.";
      toast({
        title: "Failed to Load AI Health Score",
        description: errorMessage,
        variant: "destructive",
      });
      setFinancialHealth(null);
      setHealthError(errorMessage);
    } finally {
      setIsLoadingHealth(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser) {
      fetchAllSummaries(currentUser);
    } else {
      setIsLoadingSummary(false);
      setIsLoadingHealth(false);
      setMonthlySummary(null);
      setFinancialHealth(null);
      setSummaryError(null);
      setHealthError(null);
    }
  }, [currentUser, fetchAllSummaries, refreshTrigger]);

  const renderSummaryValue = (value: number | undefined | null, isLoading: boolean, error: string | null) => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (error) return <AlertTriangle className="h-5 w-5 text-destructive" title={error} />;
    if (!currentUser) return 'N/A';
    return formatCurrency(value);
  };

  const getHealthDescription = () => {
    if (isLoadingHealth) return "Calculating...";
    if (healthError) return "Error loading";
    if (!currentUser) return "Log in to view";
    return financialHealth?.explanation || "Based on your habits";
  }

  const renderHealthScore = () => {
    if (isLoadingHealth) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (healthError) return <AlertTriangle className="h-5 w-5 text-destructive" title={healthError} />;
    if (!currentUser) return 'N/A';
    return `${financialHealth?.score || 0}/100`;
  }


  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Financial Summary
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryItemCard
          title="Financial Health"
          value={renderHealthScore()}
          icon={ShieldCheck}
          iconColor="text-green-500"
          description={getHealthDescription()}
        />
        <SummaryItemCard
          title="Total Income (Month)"
          value={renderSummaryValue(monthlySummary?.totalIncome, isLoadingSummary, summaryError)}
          icon={TrendingUp}
          iconColor="text-green-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : summaryError ? "Error" : "Current month's income"}
        />
        <SummaryItemCard
          title="Total Spent (Month)"
          value={renderSummaryValue(monthlySummary?.totalExpenses, isLoadingSummary, summaryError)}
          icon={TrendingDown}
          iconColor="text-red-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : summaryError ? "Error" : "Current month's expenses"}
        />
        <SummaryItemCard
          title="Net Saved (Month)"
          value={renderSummaryValue(monthlySummary?.netSavings, isLoadingSummary, summaryError)}
          icon={PiggyBank}
          iconColor="text-blue-500"
          description={isLoadingSummary || !currentUser ? "Fetching..." : summaryError ? "Error" : "Income minus expenses"}
        />
      </div>
    </section>
  );
}
