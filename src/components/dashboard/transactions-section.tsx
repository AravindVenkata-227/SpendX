
import RecentTransactionsTableCard from "@/components/dashboard/recent-transactions-table-card";

interface TransactionsSectionProps {
  onDataChange: () => void;
}

export default function TransactionsSection({ onDataChange }: TransactionsSectionProps) {
  return (
    <section aria-labelledby="transactions-heading">
      <h2 id="transactions-heading" className="sr-only">
        Recent Transactions
      </h2>
      <RecentTransactionsTableCard onDataChange={onDataChange} />
    </section>
  );
}
