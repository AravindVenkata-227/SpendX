
"use client";

import * as React from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { SpendingCategory, ChartConfig, TransactionFirestore } from "@/types";
import { getTransactionsForMonth } from "@/services/transactionService";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const PREDEFINED_CHART_CONFIG: ChartConfig = {
  "Food": { label: "Food", color: "hsl(var(--chart-1))" },
  "Bills": { label: "Bills", color: "hsl(var(--chart-2))" },
  "Shopping": { label: "Shopping", color: "hsl(var(--chart-3))" },
  "Transport": { label: "Transport", color: "hsl(var(--chart-4))" },
  "Entertainment": { label: "Entertainment", color: "hsl(var(--chart-5))" },
  "Other": { label: "Other", color: "hsl(var(--muted))" }, 
  "Groceries": { label: "Groceries", color: "hsl(var(--chart-1))" }, 
  "Utilities": { label: "Utilities", color: "hsl(var(--chart-2))" },
  "Rent/Mortgage": { label: "Rent/Mortgage", color: "hsl(var(--chart-3))" },
  "Health": { label: "Health", color: "hsl(var(--chart-4))" },
  "Education": { label: "Education", color: "hsl(var(--chart-5))" },
  "Income": { label: "Income", color: "hsl(var(--accent))" }, 
  "Investment": { label: "Investment", color: "hsl(var(--chart-1))" },
  "Travel": { label: "Travel", color: "hsl(var(--chart-2))" },
  "Gifts": { label: "Gifts", color: "hsl(var(--chart-3))" },
};

const FALLBACK_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--accent))", 
];

interface SpendingCategoryChartCardProps {
  refreshTrigger: number;
}

export default function SpendingCategoryChartCard({ refreshTrigger }: SpendingCategoryChartCardProps) {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [spendingData, setSpendingData] = React.useState<SpendingCategory[]>([]);
  const [chartDisplayConfig, setChartDisplayConfig] = React.useState<ChartConfig>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalMonthlySpending, setTotalMonthlySpending] = React.useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setSpendingData([]);
        setChartDisplayConfig({});
        setTotalMonthlySpending(0);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!currentUser) {
      setIsLoading(false); 
      return;
    }

    const fetchAndProcessTransactions = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; 

        const transactions: TransactionFirestore[] = await getTransactionsForMonth(currentUser.uid, year, month);

        const categoryMap: { [key: string]: number } = {};
        let currentTotalSpending = 0;

        transactions.forEach(transaction => {
          if (transaction.type === 'debit') {
            const amount = Math.abs(transaction.amount);
            const categoryName = transaction.category || "Other"; 
            categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
            currentTotalSpending += amount;
          }
        });

        const newSpendingData: SpendingCategory[] = Object.entries(categoryMap)
          .map(([name, value], index) => {
            const configEntry = PREDEFINED_CHART_CONFIG[name as keyof typeof PREDEFINED_CHART_CONFIG];
            return {
              name,
              value,
              fill: configEntry ? configEntry.color : FALLBACK_CHART_COLORS[index % FALLBACK_CHART_COLORS.length],
            };
          })
          .sort((a, b) => b.value - a.value) 
          .slice(0, 6); 

        setSpendingData(newSpendingData);
        setTotalMonthlySpending(currentTotalSpending);

        const newChartDisplayConfig: ChartConfig = {};
        newSpendingData.forEach(item => {
          if (PREDEFINED_CHART_CONFIG[item.name as keyof typeof PREDEFINED_CHART_CONFIG]) {
            newChartDisplayConfig[item.name] = PREDEFINED_CHART_CONFIG[item.name as keyof typeof PREDEFINED_CHART_CONFIG];
          } else {
            newChartDisplayConfig[item.name] = { label: item.name, color: item.fill };
          }
        });
        setChartDisplayConfig(newChartDisplayConfig);

      } catch (error: any) {
        console.error("Error processing spending data for chart:", error);
        toast({
          title: "Chart Error",
          description: error.message || "Could not load spending chart data.",
          variant: "destructive",
        });
        setSpendingData([]);
        setChartDisplayConfig({});
        setTotalMonthlySpending(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessTransactions();
  }, [currentUser, toast, refreshTrigger]); 

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full shadow-lg items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading spending chart...</p>
      </Card>
    );
  }

  if (!currentUser) {
     return (
      <Card className="flex flex-col h-full shadow-lg items-center justify-center">
        <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Please log in to view your spending chart.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (spendingData.length === 0) {
    return (
      <Card className="flex flex-col h-full shadow-lg">
        <CardHeader className="items-center pb-0">
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>Monthly spending breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No spending data available for this month.</p>
        </CardContent>
         <CardFooter className="flex-col gap-2 text-sm">
            <div className="leading-none text-muted-foreground">
            Total spending this month: ₹{totalMonthlySpending.toLocaleString()}
            </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Monthly spending breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartDisplayConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <Pie
              data={spendingData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
               {spendingData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
             <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-x-4 gap-y-1 [&>*]:basis-full sm:[&>*]:basis-[45%] md:[&>*]:basis-1/4 [&>*]:justify-start sm:[&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total spending for the current month (Total: ₹{totalMonthlySpending.toLocaleString()})
        </div>
      </CardFooter>
    </Card>
  );
}
