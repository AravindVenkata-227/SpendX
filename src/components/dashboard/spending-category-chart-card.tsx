
"use client";
import * as React from "react";
import { TrendingUp } from "lucide-react";
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
import type { SpendingCategory, ChartConfig } from "@/types";

const spendingData: SpendingCategory[] = [
  { name: "Food", value: 4500, fill: "hsl(var(--chart-1))" },
  { name: "Bills", value: 3000, fill: "hsl(var(--chart-2))" },
  { name: "Shopping", value: 2000, fill: "hsl(var(--chart-3))" },
  { name: "Transport", value: 1500, fill: "hsl(var(--chart-4))" },
  { name: "Entertainment", value: 1000, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  "Food": { label: "Food", color: "hsl(var(--chart-1))" },
  "Bills": { label: "Bills", color: "hsl(var(--chart-2))" },
  "Shopping": { label: "Shopping", color: "hsl(var(--chart-3))" },
  "Transport": { label: "Transport", color: "hsl(var(--chart-4))" },
  "Entertainment": { label: "Entertainment", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function SpendingCategoryChartCard() {
  const totalValue = React.useMemo(() => {
    return spendingData.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="items-center pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Monthly spending breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
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
              activeIndex={0} // Can be dynamic for interaction
              // activeShape can be a custom component
            >
               {spendingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
             <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total spending for the current month (Total: ₹{totalValue.toLocaleString()})
        </div>
      </CardFooter>
    </Card>
  );
}

