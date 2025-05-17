
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Transaction as UITransactionType, TransactionFirestore } from "@/types";
import { getTransactionsByAccountId, addTransaction } from '@/services/transactionService'; // Import service
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  ShoppingCart,
  Utensils,
  FileText,
  Briefcase,
  BookOpen,
  Film,
  Plane,
  ShoppingBag,
  Home,
  Car,
  PiggyBank,
  Landmark,
  Loader2, // For loading state
  PlusCircle, // For add transaction button
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BankAccount {
  id: string;
  name: string;
  icon: React.ElementType;
}

const MOCK_ACCOUNTS: BankAccount[] = [
  { id: 'acc1', name: 'Savings Account (XXXX1234)', icon: PiggyBank },
  { id: 'acc2', name: 'Current Account (YYYY5678)', icon: Briefcase },
  { id: 'acc3', name: 'Salary Account (ZZZZ9012)', icon: Landmark },
];

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Bills: FileText,
  Shopping: ShoppingCart,
  Income: Briefcase,
  Entertainment: Film,
  Transport: Car,
  Education: BookOpen,
  Housing: Home,
  Travel: Plane,
  Default: FileText, // Fallback icon
};

// Helper function to map Firestore transaction to UI transaction
const mapFirestoreTransactionToUI = (transaction: TransactionFirestore): UITransactionType => {
  const IconComponent = categoryIcons[transaction.category] || transaction.iconName && categoryIcons[transaction.iconName] || categoryIcons.Default;
  return {
    ...transaction,
    id: transaction.id!,
    icon: IconComponent,
    // Ensure date is formatted for UI if needed, here assuming it's already YYYY-MM-DD string
  };
};


export default function RecentTransactionsTableCard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(MOCK_ACCOUNTS[0]?.id);
  const [transactions, setTransactions] = useState<UITransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async (accountId: string | undefined) => {
    if (!accountId) {
      setTransactions([]);
      return;
    }
    setIsLoading(true);
    try {
      const firestoreTransactions = await getTransactionsByAccountId(accountId);
      const uiTransactions = firestoreTransactions.map(mapFirestoreTransactionToUI);
      setTransactions(uiTransactions);
      const selectedAccountName = MOCK_ACCOUNTS.find(acc => acc.id === accountId)?.name || 'Selected Account';
      toast({
        title: "Transactions Loaded",
        description: `Displaying transactions for ${selectedAccountName}.`,
      });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Could not fetch transactions from the database.",
        variant: "destructive",
      });
      setTransactions([]); // Clear transactions on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions(selectedAccountId);
  }, [selectedAccountId, fetchTransactions]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  // Mock function to add a sample transaction - for testing "Storing"
  const handleAddSampleTransaction = async () => {
    if (!selectedAccountId) {
      toast({ title: "No Account Selected", description: "Please select an account first.", variant: "destructive" });
      return;
    }
    const newTransactionData: Omit<TransactionFirestore, 'id'> = {
      accountId: selectedAccountId,
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
      description: "Sample Online Purchase",
      category: "Shopping",
      amount: -(Math.floor(Math.random() * 200) + 50), // Random amount between 50-250
      type: "debit",
      iconName: "ShoppingCart",
    };
    try {
      setIsLoading(true); // Show loader while adding
      await addTransaction(newTransactionData);
      toast({ title: "Transaction Added", description: "Sample transaction successfully added to Firestore." });
      await fetchTransactions(selectedAccountId); // Refresh the list
    } catch (error) {
      toast({ title: "Error Adding Transaction", description: "Could not add sample transaction.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-center">
            <Select onValueChange={handleAccountChange} defaultValue={selectedAccountId}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ACCOUNTS.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <account.icon className="h-4 w-4 text-muted-foreground" />
                      {account.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddSampleTransaction} variant="outline" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sample Tx
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2">
          Your latest financial activities for the selected account (from Firestore).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading transactions...</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="text-right w-[120px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No transactions found for this account, or add some using the button above.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => {
                    const Icon = transaction.icon; // Already mapped
                    return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.type === 'debit' ? (
                          <ArrowDownCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <ArrowUpCircle className="h-5 w-5 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                        )}
                      >
                        {transaction.type === 'debit' ? '-' : '+'}₹{Math.abs(transaction.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
