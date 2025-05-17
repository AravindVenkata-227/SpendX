
import SpendingCategoryChartCard from "@/components/dashboard/spending-category-chart-card";

interface ChartsSectionProps {
  refreshTrigger: number;
}

export default function ChartsSection({ refreshTrigger }: ChartsSectionProps) {
  return (
    <section aria-labelledby="charts-heading" className="h-full">
      <h2 id="charts-heading" className="sr-only">
        Spending Charts
      </h2>
      <SpendingCategoryChartCard refreshTrigger={refreshTrigger} />
    </section>
  );
}
