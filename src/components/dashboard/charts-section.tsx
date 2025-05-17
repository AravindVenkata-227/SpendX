import SpendingCategoryChartCard from "@/components/dashboard/spending-category-chart-card";

export default function ChartsSection() {
  return (
    <section aria-labelledby="charts-heading" className="h-full">
      <h2 id="charts-heading" className="sr-only">
        Spending Charts
      </h2>
      <SpendingCategoryChartCard />
    </section>
  );
}
