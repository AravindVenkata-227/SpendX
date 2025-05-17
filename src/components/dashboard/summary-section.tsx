import SummaryItemCard from "@/components/dashboard/summary-item-card";
import { ShieldCheck, PiggyBank, TrendingDown, Activity } from "lucide-react";

export default function SummarySection() {
  // Placeholder data
  const financialHealthScore = 75;
  const totalSavedThisMonth = 5000;
  const totalSpentThisMonth = 12345;
  const upcomingBills = 3;


  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Financial Summary
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryItemCard
          title="Financial Health"
          value={`${financialHealthScore}/100`}
          icon={ShieldCheck}
          iconColor="text-green-500"
          description="Based on your habits"
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
