
"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { calculateFinancialHealth, type FinancialHealthOutput, type FinancialHealthInput } from '@/ai/flows/financial-health-flow';
import { Lightbulb, Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getMonthlySummary, type MonthlySummary } from '@/services/transactionService';

export default function FinancialHealthAdviceCard() {
  const [adviceResult, setAdviceResult] = useState<FinancialHealthOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '₹0';
    return `₹${value.toLocaleString()}`;
  };

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      setAdviceResult(null);
      setError(null);
      return;
    }

    const fetchHealthAdvice = async () => {
      setIsLoading(true);
      setError(null);
      setAdviceResult(null);

      let currentMonthlySummary: MonthlySummary | null = null;
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        currentMonthlySummary = await getMonthlySummary(currentUser.uid, year, month);
      } catch (summaryError: any) {
        console.error("Error fetching monthly summary for health advice:", summaryError);
        // Don't block advice generation, use a default summary
        currentMonthlySummary = { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
      }

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
        dynamicFinancialSummary = "Not enough transaction data available for a detailed financial summary this month.";
      }
      
      if (currentMonthlySummary?.totalIncome === 0 && currentMonthlySummary?.totalExpenses === 0) {
        dynamicFinancialSummary += "\n(Note: Advice based on limited or no transaction data for the current month.)";
      }

      const input: FinancialHealthInput = {
        financialSummary: dynamicFinancialSummary,
      };

      try {
        const result = await calculateFinancialHealth(input);
        setAdviceResult(result);
      } catch (aiError: any) {
        console.error('Error generating financial health advice:', aiError);
        setError(aiError.message || 'Could not generate financial advice at this time.');
        toast({
          title: 'Error Generating Advice',
          description: aiError.message || 'Could not generate financial advice.',
          variant: 'destructive',
        });
        // Set a default advice in case of AI error
        setAdviceResult({
            score: 0, // Score might not be relevant here, but schema needs it
            explanation: "Could not load specific advice.",
            improvementTips: ["Review your budget.", "Track expenses regularly.", "Set clear financial goals."]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthAdvice();
  }, [currentUser, toast]);

  if (isLoadingAuth) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle>Financial Wellness Tips</CardTitle>
          </div>
          <CardDescription>Loading authentication...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <CardTitle>Financial Wellness Tips</CardTitle>
        </div>
        <CardDescription>
          AI-powered suggestions to help you improve your financial health.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[150px]">
        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating advice...
          </div>
        )}
        {error && !isLoading && (
          <div className="p-4 bg-destructive/10 rounded-md text-destructive flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Error Loading Advice</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {adviceResult && !isLoading && !error && (
          <>
            {adviceResult.explanation && (
              <div className="p-3 bg-muted/30 rounded-md">
                <h4 className="font-semibold text-sm text-foreground mb-1">Key Insight:</h4>
                <p className="text-sm text-muted-foreground">{adviceResult.explanation}</p>
              </div>
            )}
            {adviceResult.improvementTips && adviceResult.improvementTips.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Actionable Tips:</h4>
                <ul className="space-y-2 list-disc list-inside pl-2 text-sm text-muted-foreground">
                  {adviceResult.improvementTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        {!adviceResult && !isLoading && !error && !currentUser && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Log in to get financial wellness tips.
          </p>
        )}
         {!adviceResult && !isLoading && !error && currentUser && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No advice available at the moment. Try adding some transactions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
