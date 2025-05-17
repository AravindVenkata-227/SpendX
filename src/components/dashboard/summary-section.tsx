
"use client";

import { useState, useEffect } from 'react';
import SummaryItemCard from "@/components/dashboard/summary-item-card";
import { ShieldCheck, PiggyBank, TrendingDown, Activity, Loader2 } from "lucide-react";
import { calculateFinancialHealth, type FinancialHealthOutput } from '@/ai/flows/financial-health-flow';
import { useToast } from '@/hooks/use-toast';

export default function SummarySection() {
  const [financialHealth, setFinancialHealth] = useState<FinancialHealthOutput | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const { toast } = useToast();

  // Placeholder data - in a real app, this would come from user's actual data
  const totalSavedThisMonth = 5000;
  const totalSpentThisMonth = 12345;
  const upcomingBills = 3;

  useEffect(() => {
    const getFinancialHealth = async () => {
      setIsLoadingHealth(true);
      try {
        // In a real app, this summary would be dynamically generated from user's financial data
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
        setFinancialHealth({ score: 0, explanation: "Error loading score."}); // Default on error
      } finally {
        setIsLoadingHealth(false);
      }
    };
    getFinancialHealth();
  }, [toast]);

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Financial Summary
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryItemCard
          title="Financial Health"
          value={isLoadingHealth ? <Loader2 className="h-5 w-5 animate-spin" /> : `${financialHealth?.score || 0}/100`}
          icon={ShieldCheck}
          iconColor="text-green-500"
          description={isLoadingHealth ? "Calculating..." : financialHealth?.explanation || "Based on your habits"}
        />
        <SummaryItemCard
          title="Total Saved (Month)"
          value={`₹${totalSavedThisMonth.toLocaleString()}`}
          icon={PiggyBank}
          iconColor="text-blue-500"
          description="+10% from last month"
        />
        <SummaryItemCard
          title="Total Spent (Month)"
          value={`₹${totalSpentThisMonth.toLocaleString()}`}
          icon={TrendingDown}
          iconColor="text-red-500"
          description="-5% from last month"
        />
         <SummaryItemCard
          title="Upcoming Bills"
          value={`${upcomingBills} items`}
          icon={Activity}
          iconColor="text-orange-500"
          description="Due within 7 days"
        />
      </div>
    </section>
  );
}
