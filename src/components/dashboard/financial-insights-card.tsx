"use client";

import { useState } from 'react';
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

export default function FinancialInsightsCard() {
  const [insightResult, setInsightResult] = useState<SpendingInsightOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetInsight = async () => {
    setIsLoading(true);
    setInsightResult(null);

    const mockSpendingData = "Over the past week, spending on 'Dining Out' has increased by 30% compared to the previous week, totaling $250. Subscription services cost $50 this month. A large one-time purchase of $300 was made in 'Electronics'.";
    const mockUserPreferences = "Notify me about significant increases in category spending, unusual large transactions, and when I'm close to exceeding a budget. I don't want notifications for every small transaction.";

    try {
      const result = await generateSpendingInsight({
        spendingData: mockSpendingData,
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
    } catch (error) {
      console.error('Error generating insight:', error);
      toast({
        title: 'Error',
        description: 'Could not generate financial insight at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          <CardTitle>AI Financial Insights</CardTitle>
        </div>
        <CardDescription>
          Get personalized insights based on your spending habits.
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
            <p className="text-sm text-muted-foreground text-center py-4">Click the button below to generate your first insight.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetInsight} disabled={isLoading} className="w-full">
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
