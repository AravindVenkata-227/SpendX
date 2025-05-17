
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Transaction as UITransactionType, TransactionFirestore, Account as FirestoreAccount, UIAccount, AccountType } from "@/types";
import { getTransactionsByAccountId } from '@/services/transactionService';
import { getAccountsByUserId } from '@/services/accountService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import AddAccountDialog from './add-account-dialog';
import AddTransactionDialog from './add-transaction-dialog';

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
  Home,
  Car,
  PiggyBank,
  Landmark,
  CreditCard,
  CircleDollarSign,
  Loader2,
  TrendingUp,
  ShieldQuestion,
  HeartPulse,
  Gift,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Groceries: ShoppingCart,
  Bills: FileText,
  Utilities: FileText,
  "Rent/Mortgage": Home,
  Transport: Car,
  Shopping: ShoppingCart,
  Entertainment: Film,
  Health: HeartPulse,
  Education: BookOpen,
  Income: Briefcase,
  Investment: TrendingUp,
  Travel: Plane,
  Gifts: Gift,
  Other: CircleDollarSign,
  Default: FileText,
};

const accountTypeIcons: { [key: string]: React.ElementType } = {
  Savings: PiggyBank,
  Checking: Landmark, 
  "Credit Card": CreditCard,
  Investment: TrendingUp,
  Loan: Briefcase,
  Other: ShieldQuestion,
  Default: CircleDollarSign,
};

const mapFirestoreAccountToUIAccount = (account: FirestoreAccount): UIAccount => {
  const IconComponent = accountTypeIcons[account.type as AccountType] || accountTypeIcons.Default;
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    icon: IconComponent,
  };
};

const mapFirestoreTransactionToUI = (transaction: TransactionFirestore): UITransactionType => {
  const IconComponent = categoryIcons[transaction.category] || categoryIcons[transaction.iconName as keyof typeof categoryIcons] || categoryIcons.Default;
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
        setSelectedAccountId(uiAccounts[0].id);
      } else if (uiAccounts.length === 0) {
        setSelectedAccountId(undefined);
      }
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      let toastMessage = error.message || "Could not fetch your accounts.";
      if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
        toastMessage = "Permission denied fetching accounts. Ensure Firestore rules are deployed and allow access, and that account documents have the correct 'userId' matching the authenticated user.";
      } else if (error.code === 'failed-precondition' || (error.message && (error.message.toLowerCase().includes('index') || error.message.toLowerCase().includes('missing or insufficient permissions')))) {
         toastMessage = "Missing or insufficient Firestore index for fetching accounts. Check Firestore logs for details and a link to create it.";
      }
      toast({
        title: "Error Loading Accounts",
        description: toastMessage,
        variant: "destructive",
      });
      setAccounts([]);
      setSelectedAccountId(undefined);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [toast, selectedAccountId]);

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
         try {
            const [year, month, day] = t.date.split('-').map(Number);
            if (year && month && day) {
              newFormattedDates[t.id] = new Date(year, month - 1, day).toLocaleDateString();
            } else {
              newFormattedDates[t.id] = t.date;
            }
          } catch (e) {
            console.warn(`Could not parse date string: ${t.date} for transaction ${t.id}`, e);
            newFormattedDates[t.id] = t.date;
          }
      });
      setFormattedDates(newFormattedDates);
      
      const selectedAccountName = accounts.find(acc => acc.id === accountId)?.name || 'Selected Account';
      if (uiTransactions.length === 0 && accounts.length > 0) {
         toast({
          title: "No Transactions",
          description: `No transactions found for ${selectedAccountName}.`,
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
  }, [toast, accounts]);

  useEffect(() => {
    if (currentUser && selectedAccountId) {
        fetchTransactions(selectedAccountId, currentUser.uid);
    } else {
        setTransactions([]);
        setFormattedDates({});
    }
  }, [selectedAccountId, currentUser, fetchTransactions]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const refreshTransactions = () => {
    if (currentUser && selectedAccountId) {
      fetchTransactions(selectedAccountId, currentUser.uid);
    }
  };
  
  const refreshAccounts = () => {
    if (currentUser) {
      fetchAccounts(currentUser.uid);
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
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 items-stretch">
            {isLoadingAccounts ? (
              <div className="flex items-center justify-center w-full sm:w-[200px] h-10 border rounded-md">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Accounts...</span>
              </div>
            ) : (
              <Select onValueChange={handleAccountChange} value={selectedAccountId} disabled={!currentUser || accounts.length === 0 || isLoadingTransactions}>
                <SelectTrigger className="w-full sm:w-[200px]" aria-label="Select Account">
                  <SelectValue placeholder="Select account" />
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
            <AddAccountDialog currentUser={currentUser} onAccountAdded={refreshAccounts} />
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
          <>
          <ScrollArea className="h-[300px] mb-4">
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
            {currentUser && selectedAccountId && accounts.length > 0 && (
                 <div className="flex justify-center mt-4">
                    <AddTransactionDialog 
                        currentUser={currentUser} 
                        selectedAccountId={selectedAccountId} 
                        allAccounts={accounts} // Pass the accounts array
                        onTransactionAdded={refreshTransactions}
                    />
                </div>
            )}
            {!selectedAccountId && accounts.length === 0 && !isLoadingAccounts && currentUser && (
                 <div className="text-center text-muted-foreground mt-4">
                    Please add an account first to start adding transactions.
                 </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

    