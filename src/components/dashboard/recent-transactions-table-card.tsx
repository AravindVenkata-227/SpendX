
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UITransactionType, TransactionFirestore, Account as FirestoreAccount, UIAccount, AccountType } from "@/types";
import { getTransactionsByAccountId, deleteTransaction } from '@/services/transactionService';
import { getAccountsByUserId, deleteAccount as deleteAccountService } from '@/services/accountService'; // Added deleteAccount
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import AddAccountDialog from './add-account-dialog';
import EditAccountDialog from './edit-account-dialog'; 
import AddTransactionDialog from './add-transaction-dialog';
import EditTransactionDialog from './edit-transaction-dialog'; 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


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
import { Button } from "@/components/ui/button"; 
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
  Pencil, 
  Trash2, 
  Edit3, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseISO, isValid } from 'date-fns';

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

  const [editingTransaction, setEditingTransaction] = useState<UITransactionType | null>(null);
  const [isEditTransactionDialogOpen, setIsEditTransactionDialogOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isDeleteTransactionDialogOpen, setIsDeleteTransactionDialogOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState<UIAccount | null>(null);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setAccounts([]);
        setTransactions([]);
        setFormattedDates({});
        setSelectedAccountId(undefined);
        setEditingAccount(null);
        setDeletingAccountId(null);
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
            const parsedDate = parseISO(t.date);
            if (isValid(parsedDate)) {
              newFormattedDates[t.id] = parsedDate.toLocaleDateString();
            } else {
              console.warn(`Invalid date string: ${t.date} for transaction ${t.id}`);
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
       let toastMessage = error.message || "Could not fetch transactions for the selected account.";
        if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
            toastMessage = "Permission denied fetching transactions. Check Firestore rules and ensure data has correct userId.";
        } else if (error.code === 'failed-precondition' || (error.message && (error.message.toLowerCase().includes('index') || error.message.toLowerCase().includes('missing or insufficient permissions')))) {
            toastMessage = "Missing or insufficient Firestore index for fetching transactions. Check Firestore logs for details and a link to create it.";
        }
      toast({
        title: "Error Loading Transactions",
        description: toastMessage,
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

  const refreshData = (isAccountChange: boolean = false) => {
    if (currentUser) {
      fetchAccounts(currentUser.uid).then(() => {
        if (!isAccountChange && selectedAccountId) {
           fetchTransactions(selectedAccountId, currentUser.uid);
        } else if (isAccountChange) {
            const currentAccounts = accounts; // Use the state variable 'accounts' which will be updated by fetchAccounts
            if (currentAccounts.length > 0 && !currentAccounts.find(a => a.id === selectedAccountId)) {
                setSelectedAccountId(currentAccounts[0].id);
            } else if (currentAccounts.length === 0) {
                setSelectedAccountId(undefined);
                setTransactions([]); // Clear transactions if no accounts left
            } else if (selectedAccountId) {
                 // If selected account still exists, re-fetch its transactions
                fetchTransactions(selectedAccountId, currentUser.uid);
            }
        }
      });
    }
  };
  
  const handleEditTransaction = (transaction: UITransactionType) => {
    setEditingTransaction(transaction);
    setIsEditTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!currentUser || !deletingTransactionId) {
      toast({ title: "Error", description: "User or transaction ID missing for deletion.", variant: "destructive" });
      return;
    }
    try {
      await deleteTransaction(deletingTransactionId, currentUser.uid);
      toast({ title: "Success", description: "Transaction deleted successfully." });
      refreshData();
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error Deleting Transaction", description: error.message || "Could not delete transaction.", variant: "destructive" });
    } finally {
      setIsDeleteTransactionDialogOpen(false);
      setDeletingTransactionId(null);
    }
  };

  const handleEditAccount = () => {
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (account) {
      setEditingAccount(account);
      setIsEditAccountDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Please select an account to edit.", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !deletingAccountId) {
      toast({ title: "Error", description: "User or account ID missing for deletion.", variant: "destructive" });
      return;
    }
    try {
      await deleteAccountService(deletingAccountId, currentUser.uid);
      toast({ title: "Success", description: "Account deleted successfully." });
      // Reset selected account and refresh, which will pick the first available or none
      setSelectedAccountId(undefined); 
      refreshData(true); 
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({ title: "Error Deleting Account", description: error.message || "Could not delete account.", variant: "destructive" });
    } finally {
      setIsDeleteAccountDialogOpen(false);
      setDeletingAccountId(null);
    }
  };

  const handleInitiateDeleteFromEditDialog = () => {
    if (editingAccount) {
      setIsEditAccountDialogOpen(false); // Close edit dialog
      setDeletingAccountId(editingAccount.id); // Set ID for delete confirmation
      setIsDeleteAccountDialogOpen(true); // Open delete confirmation dialog
    }
  };


  return (
    <>
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
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <Select onValueChange={handleAccountChange} value={selectedAccountId} disabled={!currentUser || accounts.length === 0 || isLoadingTransactions}>
                  <SelectTrigger className="flex-grow sm:w-[200px]" aria-label="Select Account">
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
                <Button variant="outline" size="icon" onClick={handleEditAccount} disabled={!selectedAccountId || isLoadingAccounts || isLoadingTransactions}>
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Edit Account</span>
                </Button>
                {/* Standalone Delete Account button removed from here */}
              </div>
            )}
             <AddAccountDialog currentUser={currentUser} onAccountAdded={() => refreshData(true)} />
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
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading transactions...</p>
          </div>
        ) : !currentUser ? (
           <div className="flex items-center justify-center h-[300px]">
             <p className="text-muted-foreground">Login to see your transactions.</p>
           </div>
        ) : !selectedAccountId && accounts.length > 0 ? (
            <div className="flex items-center justify-center h-[300px]">
             <p className="text-muted-foreground">Please select an account to view transactions.</p>
           </div>
        ) : (
          <>
          <ScrollArea className="h-[300px] mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="text-right w-[100px]">Amount</TableHead>
                  <TableHead className="w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
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
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 mr-1" onClick={() => handleEditTransaction(transaction)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                            setDeletingTransactionId(transaction.id);
                            setIsDeleteTransactionDialogOpen(true);
                        }}>
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete</span>
                        </Button>
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
                        allAccounts={accounts}
                        onTransactionAdded={refreshData}
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

    {currentUser && editingTransaction && (
        <EditTransactionDialog
          currentUser={currentUser}
          transactionToEdit={editingTransaction}
          open={isEditTransactionDialogOpen}
          onOpenChange={(open) => {
            setIsEditTransactionDialogOpen(open);
            if (!open) setEditingTransaction(null);
          }}
          onTransactionUpdated={() => {
            refreshData();
            setIsEditTransactionDialogOpen(false);
            setEditingTransaction(null);
          }}
          accountName={accounts.find(acc => acc.id === editingTransaction.accountId)?.name}
        />
      )}

      <AlertDialog open={isDeleteTransactionDialogOpen} onOpenChange={setIsDeleteTransactionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTransactionId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentUser && editingAccount && (
        <EditAccountDialog
          currentUser={currentUser}
          accountToEdit={editingAccount}
          open={isEditAccountDialogOpen}
          onOpenChange={(open) => {
            setIsEditAccountDialogOpen(open);
            if (!open) setEditingAccount(null);
          }}
          onAccountUpdated={() => {
            refreshData(true); 
            setIsEditAccountDialogOpen(false);
            setEditingAccount(null);
          }}
          onInitiateDelete={handleInitiateDeleteFromEditDialog} // Pass the new handler
        />
      )}

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account. All associated transactions will remain but will no longer be linked to this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAccountId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
