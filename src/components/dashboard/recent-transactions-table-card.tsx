
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Transaction as UITransactionType, TransactionFirestore } from "@/types";
import { getTransactionsByAccountId, addTransaction } from '@/services/transactionService';
import { auth } from '@/lib/firebase'; // Import auth
import { onAuthStateChanged, type User } from 'firebase/auth'; // Import onAuthStateChanged

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
  Loader2,
  PlusCircle,
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
  Default: FileText,
};

const mapFirestoreTransactionToUI = (transaction: TransactionFirestore): UITransactionType => {
  const IconComponent = categoryIcons[transaction.category] || (transaction.iconName && categoryIcons[transaction.iconName]) || categoryIcons.Default;
  return {
    // Explicitly map fields excluding userId for the UI type
    id: transaction.id!,
    accountId: transaction.accountId,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type,
    icon: IconComponent,
  };
};


export default function RecentTransactionsTableCard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(MOCK_ACCOUNTS[0]?.id);
  const [transactions, setTransactions] = useState<UITransactionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Handle logged out state if necessary, e.g., clear transactions
        setTransactions([]);
        setFormattedDates({});
        // toast({ title: "Not Authenticated", description: "Please login to view transactions.", variant: "destructive" });
      }
    });
    return () => unsubscribe();
  }, []);


  const fetchTransactions = useCallback(async (accountId: string | undefined) => {
    if (!accountId) {
      setTransactions([]);
      setFormattedDates({});
      return;
    }
    if (!currentUser) {
      // toast({ title: "Authentication Required", description: "Please log in to fetch transactions.", variant: "destructive" });
      setTransactions([]); // Clear transactions if user logs out
      return;
    }
    setIsLoading(true);
    try {
      const firestoreTransactions = await getTransactionsByAccountId(accountId, currentUser.uid);
      const uiTransactions = firestoreTransactions.map(mapFirestoreTransactionToUI);
      setTransactions(uiTransactions);

      const newFormattedDates: Record<string, string> = {};
      uiTransactions.forEach(t => {
        newFormattedDates[t.id] = new Date(t.date).toLocaleDateString();
      });
      setFormattedDates(newFormattedDates);

      const selectedAccountName = MOCK_ACCOUNTS.find(acc => acc.id === accountId)?.name || 'Selected Account';
      if (firestoreTransactions.length > 0) {
        toast({
          title: "Transactions Loaded",
          description: `Displaying transactions for ${selectedAccountName}.`,
        });
      } else {
        toast({
          title: "No Transactions",
          description: `No transactions found for ${selectedAccountName} for your account. You can add some using the button.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error Loading Transactions",
        description: "Could not fetch transactions. Please check server logs for details (e.g., Firestore permissions or missing indexes).",
        variant: "destructive",
      });
      setTransactions([]);
      setFormattedDates({});
    } finally {
      setIsLoading(false);
    }
  }, [toast, currentUser]);

  useEffect(() => {
    if (currentUser && selectedAccountId) { // Only fetch if user is logged in and account is selected
        fetchTransactions(selectedAccountId);
    } else if (!currentUser) {
        setTransactions([]); // Clear transactions if user logs out or is not logged in
        setFormattedDates({});
    }
  }, [selectedAccountId, fetchTransactions, currentUser]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleAddSampleTransaction = async () => {
    if (!selectedAccountId) {
      toast({ title: "No Account Selected", description: "Please select an account first.", variant: "destructive" });
      return;
    }
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please log in to add transactions.", variant: "destructive" });
      return;
    }

    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const transactionDate = `${year}-${month}-${day}`;

    const newTransactionData: Omit<TransactionFirestore, 'id'> = {
      userId: currentUser.uid, // Add userId
      accountId: selectedAccountId,
      date: transactionDate,
      description: "Sample Online Purchase",
      category: "Shopping",
      amount: -(Math.floor(Math.random() * 200) + 50),
      type: "debit",
      iconName: "ShoppingCart",
    };
    try {
      setIsLoading(true);
      await addTransaction(newTransactionData);
      toast({ title: "Transaction Added", description: "Sample transaction successfully added to Firestore." });
      await fetchTransactions(selectedAccountId);
    } catch (error) {
      toast({ title: "Error Adding Transaction", description: "Could not add sample transaction.", variant: "destructive" });
      console.error("Error adding sample transaction:", error);
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
            <Select onValueChange={handleAccountChange} defaultValue={selectedAccountId} disabled={!currentUser || isLoading}>
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
            <Button onClick={handleAddSampleTransaction} variant="outline" className="w-full sm:w-auto" disabled={!currentUser || isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Sample Tx
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2">
          {!currentUser ? "Please log in to view your transactions." : `Your latest financial activities for the selected account (from Firestore).`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading transactions...</p>
          </div>
        ) : !currentUser ? (
           <div className="flex items-center justify-center h-[200px]">
             <p className="text-muted-foreground">Login to see your transactions.</p>
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
                    const Icon = transaction.icon;
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
                      <TableCell>{formattedDates[transaction.id] || transaction.date}</TableCell>
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

