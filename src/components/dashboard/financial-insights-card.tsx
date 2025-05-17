
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
import { getUserProfile, type UserProfile, type NotificationPreferences } from '@/services/userService';

const defaultNotificationPrefs: NotificationPreferences = {
  onOverspending: true,
  onLargeTransactions: true,
  onSavingsOpportunities: true,
  emailForAISuggestions: false,
};

export default function FinancialInsightsCard() {
  const [insightResult, setInsightResult] = useState<SpendingInsightOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching profile for insights card:", error);
          setUserProfile(null); 
        }
      } else {
        setUserProfile(null);
      }
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
    }
    return summary;
  };

  const formatUserPreferencesForAI = (prefs: NotificationPreferences | undefined | null): string => {
    if (!prefs) {
      return "User notification preferences not available or not set. Using default considerations.";
    }
    let prefString = "User preferences for notifications:\n";
    prefString += `- Toast for Overspending alerts: ${prefs.onOverspending ? 'Enabled' : 'Disabled'}\n`;
    prefString += `- Toast for Large transaction alerts: ${prefs.onLargeTransactions ? 'Enabled' : 'Disabled'}\n`;
    prefString += `- Toast for Savings opportunity alerts: ${prefs.onSavingsOpportunities ? 'Enabled' : 'Disabled'}\n`;
    prefString += `- Email for important AI suggestions: ${prefs.emailForAISuggestions ? 'Enabled' : 'Disabled'}\n`;
    prefString += "Consider these preferences when deciding to send a notification (toast or email).";
    return prefString;
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
    
    let currentPrefs = defaultNotificationPrefs;
    try {
        const freshProfile = await getUserProfile(currentUser.uid);
        setUserProfile(freshProfile); // Update local profile state
        if (freshProfile?.notificationPreferences) {
            currentPrefs = freshProfile.notificationPreferences;
        }
    } catch (profileError) {
        console.error("Could not fetch latest profile for insight generation:", profileError);
        currentPrefs = userProfile?.notificationPreferences || defaultNotificationPrefs;
    }
    
    const userPreferencesString = formatUserPreferencesForAI(currentPrefs);

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; 
      const transactions = await getTransactionsForMonth(currentUser.uid, year, month);
      const spendingDataString = formatTransactionsForAI(transactions);

      const result = await generateSpendingInsight({
        spendingData: spendingDataString,
        userPreferences: userPreferencesString,
      });
      setInsightResult(result);

      if (result.sendNotification) {
        toast({
          title: 'New Financial Insight!',
          description: result.insight,
          variant: 'default',
          duration: 7000, 
        });

        // Check user's preference for receiving AI suggestion emails
        if (userProfile?.notificationPreferences?.emailForAISuggestions && currentUser.email) {
            console.log(`SIMULATING EMAIL: Would send insight to user ${currentUser.email}: "${result.insight}"`);
            toast({
                title: 'Email Simulation',
                description: `An email with this insight would be sent to ${currentUser.email}. (This is a simulation for demonstration purposes)`,
                variant: 'default',
                duration: 8000,
            });
        }
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
          Get personalized insights based on your spending habits for the current month and your notification preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 min-h-[100px]">
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
                <p className="text-xs text-accent mt-2">A toast notification for this insight was triggered based on your preferences.</p>
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
