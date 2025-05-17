import RecentTransactionsTableCard from "@/components/dashboard/recent-transactions-table-card";

export default function TransactionsSection() {
  return (
    <section aria-labelledby="transactions-heading">
      <h2 id="transactions-heading" className="sr-only">
        Recent Transactions
      </h2>
      <RecentTransactionsTableCard />
    </section>
  );
}
