
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Transaction as UITransactionType, TransactionFirestore, Account as FirestoreAccount, UIAccount } from "@/types";
import { getTransactionsByAccountId, addTransaction } from '@/services/transactionService';
import { getAccountsByUserId } from '@/services/accountService'; // Import account service
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

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
  CreditCard,
  CircleDollarSign, // Default account icon
  Loader2,
  PlusCircle,
  Banknote, // Another option for generic account
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon mapping for transaction categories
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

// Icon mapping for account types
const accountTypeIcons: { [key: string]: React.ElementType } = {
  Savings: PiggyBank,
  Checking: Briefcase, // Or Banknote
  Current: Landmark,
  CreditCard: CreditCard,
  Default: CircleDollarSign,
};

const mapFirestoreAccountToUIAccount = (account: FirestoreAccount): UIAccount => {
  const IconComponent = accountTypeIcons[account.type] || accountTypeIcons.Default;
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    icon: IconComponent,
  };
};

const mapFirestoreTransactionToUI = (transaction: TransactionFirestore): UITransactionType => {
  const IconComponent = categoryIcons[transaction.category] || (transaction.iconName && categoryIcons[transaction.iconName]) || categoryIcons.Default;
  return {
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
  const [accounts, setAccounts] = useState<UIAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<UITransactionType[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const { toast } = useToast();
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setAccounts([]);
        setTransactions([]);
        setFormattedDates({});
        setSelectedAccountId(undefined);
        setIsLoadingAccounts(false);
        setIsLoadingTransactions(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAccounts = useCallback(async (userId: string) => {
    setIsLoadingAccounts(true);
    try {
      const firestoreAccounts = await getAccountsByUserId(userId);
      const uiAccounts = firestoreAccounts.map(mapFirestoreAccountToUIAccount);
      setAccounts(uiAccounts);
      if (uiAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(uiAccounts[0].id); // Select first account by default
      } else if (uiAccounts.length === 0) {
        setSelectedAccountId(undefined); // No accounts, no selection
        toast({
          title: "No Accounts Found",
          description: "Please add a financial account to track transactions.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      toast({
        title: "Error Loading Accounts",
        description: error.message || "Could not fetch your accounts.",
        variant: "destructive",
      });
      setAccounts([]);
      setSelectedAccountId(undefined);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [toast, selectedAccountId]); // Added selectedAccountId to dependencies

  useEffect(() => {
    if (currentUser) {
      fetchAccounts(currentUser.uid);
    } else {
      setIsLoadingAccounts(false);
      setAccounts([]);
      setSelectedAccountId(undefined);
    }
  }, [currentUser, fetchAccounts]);


  const fetchTransactions = useCallback(async (accountId: string | undefined, userId: string) => {
    if (!accountId || !userId) {
      setTransactions([]);
      setFormattedDates({});
      setIsLoadingTransactions(false);
      return;
    }
    setIsLoadingTransactions(true);
    try {
      const firestoreTransactions = await getTransactionsByAccountId(accountId, userId);
      const uiTransactions = firestoreTransactions.map(mapFirestoreTransactionToUI);
      setTransactions(uiTransactions);

      const newFormattedDates: Record<string, string> = {};
      uiTransactions.forEach(t => {
        newFormattedDates[t.id] = new Date(t.date).toLocaleDateString();
      });
      setFormattedDates(newFormattedDates);

      const selectedAccountName = accounts.find(acc => acc.id === accountId)?.name || 'Selected Account';
      if (uiTransactions.length === 0) {
         toast({
          title: "No Transactions",
          description: `No transactions found for ${selectedAccountName}. You can add some using the button.`,
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error Loading Transactions",
        description: error.message || "Could not fetch transactions for the selected account.",
        variant: "destructive",
      });
      setTransactions([]);
      setFormattedDates({});
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [toast, accounts]); // Added accounts to dependency

  useEffect(() => {
    if (currentUser && selectedAccountId) {
        fetchTransactions(selectedAccountId, currentUser.uid);
    } else {
        setTransactions([]);
        setFormattedDates({});
        if(currentUser && accounts.length > 0 && !selectedAccountId) {
          // Case where accounts loaded, but none is selected yet (e.g. default selection failed)
          // setSelectedAccountId(accounts[0].id); // Re-attempt to select first account
        }
    }
  }, [selectedAccountId, currentUser, fetchTransactions, accounts]);

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
      userId: currentUser.uid,
      accountId: selectedAccountId,
      date: transactionDate,
      description: "Sample Online Purchase",
      category: "Shopping",
      amount: -(Math.floor(Math.random() * 200) + 50),
      type: "debit",
      iconName: "ShoppingCart",
    };
    try {
      setIsLoadingTransactions(true); // Also set loading for transactions
      await addTransaction(newTransactionData);
      toast({ title: "Transaction Added", description: "Sample transaction successfully added." });
      await fetchTransactions(selectedAccountId, currentUser.uid); // Refresh transactions
    } catch (error: any) {
      toast({ title: "Error Adding Transaction", description: error.message || "Could not add sample transaction.", variant: "destructive" });
      console.error("Error adding sample transaction:", error);
    } finally {
      // setIsLoadingTransactions will be handled by fetchTransactions
    }
  };

  const handleAddNewAccount = () => {
    toast({
        title: "Feature Coming Soon!",
        description: "The ability to add new financial accounts is under development.",
    });
    // For testing, you could add a mock account to Firestore here:
    // if (currentUser) {
    //   addAccount({
    //     userId: currentUser.uid,
    //     name: "Test Savings " + Math.floor(Math.random() * 1000),
    //     type: "Savings",
    //     iconName: "PiggyBank",
    //   }).then(() => {
    //     toast({ title: "Sample Account Added", description: "Refreshing account list..."});
    //     fetchAccounts(currentUser.uid);
    //   }).catch(err => {
    //      toast({ title: "Error Adding Sample Account", description: err.message, variant: "destructive" });
    //   });
    // }
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
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center w-full sm:w-[280px] h-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading accounts...</span>
              </div>
            ) : (
              <Select onValueChange={handleAccountChange} value={selectedAccountId} disabled={!currentUser || accounts.length === 0 || isLoadingTransactions}>
                <SelectTrigger className="w-full sm:w-[280px]" aria-label="Select Account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 && <SelectItem value="no-accounts" disabled>No accounts found</SelectItem>}
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <account.icon className="h-4 w-4 text-muted-foreground" />
                        {account.name} ({account.type})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={handleAddNewAccount} variant="outline" className="w-full sm:w-auto" disabled={!currentUser || isLoadingAccounts}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2">
          {!currentUser ? "Please log in to view your transactions." : 
           accounts.length === 0 && !isLoadingAccounts ? "Add an account to start tracking transactions." :
           `Your latest financial activities for the selected account.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading transactions...</p>
          </div>
        ) : !currentUser ? (
           <div className="flex items-center justify-center h-[200px]">
             <p className="text-muted-foreground">Login to see your transactions.</p>
           </div>
        ) : !selectedAccountId && accounts.length > 0 ? (
            <div className="flex items-center justify-center h-[200px]">
             <p className="text-muted-foreground">Please select an account to view transactions.</p>
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
                      {accounts.length === 0 && !isLoadingAccounts ? "No accounts available." :
                       !selectedAccountId && !isLoadingAccounts ? "Select an account to see transactions." :
                       "No transactions found for this account."}
                       <br/>
                       {currentUser && selectedAccountId && <Button onClick={handleAddSampleTransaction} variant="link" size="sm" className="mt-2" disabled={isLoadingTransactions}>
                            <PlusCircle className="mr-1 h-3 w-3" /> Add Sample Transaction
                        </Button>}
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
                 {transactions.length > 0 && currentUser && selectedAccountId && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                             <Button onClick={handleAddSampleTransaction} variant="outline" size="sm" className="w-full sm:w-auto" disabled={isLoadingTransactions}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Sample Transaction to Selected Account
                            </Button>
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
