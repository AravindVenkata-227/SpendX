
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateSpendingInsight, type SpendingInsightOutput } from '@/ai/flows/spending-insights';
import { Lightbulb, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getTransactionsForMonth, type TransactionFirestore } from '@/services/transactionService';

export default function FinancialInsightsCard() {
  const [insightResult, setInsightResult] = useState<SpendingInsightOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const formatTransactionsForAI = (transactions: TransactionFirestore[]): string => {
    if (transactions.length === 0) {
      return "No spending data available for the current month.";
    }

    const categoryTotals: Record<string, number> = {};
    let totalSpending = 0;

    transactions.forEach(t => {
      if (t.type === 'debit') {
        const amount = Math.abs(t.amount);
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
        totalSpending += amount;
      }
    });

    let summary = `Summary of spending for the current month (Total: ₹${totalSpending.toLocaleString()}):\n`;
    for (const [category, amount] of Object.entries(categoryTotals)) {
      summary += `- Spent ₹${amount.toLocaleString()} in ${category}.\n`;
    }

    if (Object.keys(categoryTotals).length === 0 && totalSpending === 0) {
        summary = "No debit transactions (spending) recorded for the current month.";
    } else if (Object.keys(categoryTotals).length === 0 && totalSpending > 0) {
        // This case should ideally not happen if totalSpending is sum of debits.
        // It might occur if there are only credit transactions with positive amounts,
        // but our AI prompt is about spending.
        summary = "No spending (debit transactions) in specific categories found this month, though overall balance might have changed.";
    }

    return summary;
  };

  const handleGetInsight = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to generate financial insights.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setInsightResult(null);

    const mockUserPreferences = "Notify me about significant increases in category spending, unusual large transactions, and when I'm close to exceeding a budget. I don't want notifications for every small transaction.";

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed

      const transactions = await getTransactionsForMonth(currentUser.uid, year, month);
      const spendingDataString = formatTransactionsForAI(transactions);

      const result = await generateSpendingInsight({
        spendingData: spendingDataString,
        userPreferences: mockUserPreferences,
      });
      setInsightResult(result);

      if (result.sendNotification) {
        toast({
          title: 'New Financial Insight!',
          description: result.insight,
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error generating insight:', error);
      toast({
        title: 'Error Generating Insight',
        description: error.message || 'Could not generate financial insight at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle>AI Financial Insights</CardTitle>
          </div>
          <CardDescription>
            Loading authentication state...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[100px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <CardTitle>AI Financial Insights</CardTitle>
        </div>
        <CardDescription>
          Get personalized insights based on your spending habits for the current month.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating insight...
          </div>
        )}
        {insightResult && !isLoading && (
          <div className="p-4 bg-muted/50 rounded-md">
            <p className="text-sm font-semibold">Latest Insight:</p>
            <p className="text-sm text-foreground">{insightResult.insight}</p>
            {insightResult.sendNotification && (
                <p className="text-xs text-accent mt-2">A notification for this insight was triggered.</p>
            )}
          </div>
        )}
        {!insightResult && !isLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {currentUser ? 'Click the button below to generate your insight.' : 'Log in to generate insights.'}
            </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetInsight} disabled={isLoading || !currentUser} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Generating...' : 'Get Latest Insight'}
        </Button>
      </CardFooter>
    </Card>
  );
}
