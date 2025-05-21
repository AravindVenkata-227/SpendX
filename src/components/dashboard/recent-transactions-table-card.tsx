
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UITransactionType, TransactionFirestore, Account as FirestoreAccount, UIAccount, AccountType, PaginatedTransactionsResult } from "@/types";
import { getTransactionsByAccountId, deleteTransaction } from '@/services/transactionService';
import { getAccountsByUserId, deleteAccount as deleteAccountService } from '@/services/accountService';
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isValid, parseISO, format } from 'date-fns';
import type { DocumentSnapshot } from 'firebase/firestore';


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
    accountNumberLast4: account.accountNumberLast4,
  };
};

const mapFirestoreTransactionToUI = (transaction: TransactionFirestore): UITransactionType => {
  const IconComponent = categoryIcons[transaction.category] || categoryIcons[transaction.iconName as keyof typeof categoryIcons] || categoryIcons.Default;
  let formattedDate = transaction.date; // Default to original string if parsing fails
  try {
    // Attempt to parse assuming YYYY-MM-DD first (from Firestore)
    const parsed = parseISO(transaction.date);
    if (isValid(parsed)) {
      // Then format to DD/MM/YYYY for display
      formattedDate = format(parsed, 'dd/MM/yyyy');
    } else {
      // If parseISO fails, it might already be in DD/MM/YYYY from a previous client-side format.
      // We can try parsing it as DD/MM/YYYY to re-validate, but for display, we can use it if it's not ISO.
      // However, it's better if data in Firestore is consistently YYYY-MM-DD.
      // For now, if parseISO fails, we assume it's a displayable string or an error to be caught.
      // A more robust solution would be to ensure date is always stored as YYYY-MM-DD or Timestamp.
      // console.warn(`Could not parse date string "${transaction.date}" as ISO for transaction ${transaction.id}. Using original string.`);
    }
  } catch (e) {
    // console.warn(`Error parsing date string "${transaction.date}" for transaction ${transaction.id}: `, e);
  }
  return {
    id: transaction.id!,
    accountId: transaction.accountId,
    date: formattedDate,
    description: transaction.description,
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type,
    icon: IconComponent,
  };
};

interface RecentTransactionsTableCardProps {
  onDataChange: () => void;
}

export default function RecentTransactionsTableCard({ onDataChange }: RecentTransactionsTableCardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<UIAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);

  const [transactions, setTransactions] = useState<UITransactionType[]>([]);
  const [lastLoadedDoc, setLastLoadedDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false); // False initially, true when an account is selected
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState(false);

  const { toast } = useToast();

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
        setSelectedAccountId(undefined);
        setLastLoadedDoc(null);
        setHasMoreTransactions(true);
        setEditingAccount(null);
        setDeletingAccountId(null);
        setIsLoadingAccounts(false);
        setIsLoadingTransactions(false);
        setAccountsError(null);
        setTransactionsError(null);

        // Close all dialogs on logout
        setIsEditTransactionDialogOpen(false);
        setIsDeleteTransactionDialogOpen(false);
        setIsEditAccountDialogOpen(false);
        setIsDeleteAccountDialogOpen(false);
        setEditingTransaction(null);
        setDeletingTransactionId(null);
        setEditingAccount(null);
        setDeletingAccountId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAccounts = useCallback(async (userId: string) => {
    if (!userId) {
      toast({ title: "Authentication Error", description: "User ID missing, cannot fetch accounts.", variant: "destructive" });
      setIsLoadingAccounts(false);
      setAccounts([]);
      setSelectedAccountId(undefined);
      setAccountsError("User ID missing for fetching accounts.");
      return [];
    }
    console.log(`Fetching accounts for userId: ${userId}`);
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const firestoreAccounts = await getAccountsByUserId(userId);
      const uiAccounts = firestoreAccounts.map(mapFirestoreAccountToUIAccount);
      setAccounts(uiAccounts);
      if (uiAccounts.length > 0) {
        const currentSelectedStillExists = uiAccounts.some(acc => acc.id === selectedAccountId);
        if (!currentSelectedStillExists) {
          setSelectedAccountId(uiAccounts[0].id); // Default to first account if current selection is gone or none
        }
      } else {
        setSelectedAccountId(undefined);
        setTransactions([]); // Clear transactions if no accounts
        setLastLoadedDoc(null);
        setHasMoreTransactions(false);
      }
      return uiAccounts;
    } catch (error: any) {
      console.error("Failed to fetch accounts:", error);
      let toastMessage = error.message || "Could not fetch your accounts.";
       if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
        toastMessage = "Permission denied fetching accounts. Ensure Firestore rules are deployed and allow access, and that account documents have the correct 'userId' matching the authenticated user.";
      } else if (error.message && (error.message.toLowerCase().includes('index') || error.message.toLowerCase().includes('missing or insufficient permissions'))) {
         toastMessage = "Missing or insufficient Firestore index for fetching accounts. Check Firestore logs for details and a link to create it.";
      }
      toast({
        title: "Failed to Load Accounts",
        description: toastMessage,
        variant: "destructive",
      });
      setAccounts([]);
      setSelectedAccountId(undefined);
      setTransactions([]);
      setLastLoadedDoc(null);
      setHasMoreTransactions(false);
      setAccountsError(toastMessage);
      return [];
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [toast, selectedAccountId]); // selectedAccountId in deps to re-evaluate if it needs to be reset

  useEffect(() => {
    if (currentUser && currentUser.uid) {
      fetchAccounts(currentUser.uid);
    }
    // else handled by onAuthStateChanged
  }, [currentUser, fetchAccounts]);


  const fetchTransactionsBatch = useCallback(async (accountId: string | undefined, userId: string, lastDoc: DocumentSnapshot | null, initialLoad: boolean = false) => {
    if (!accountId) {
      if(initialLoad) setTransactions([]);
      setLastLoadedDoc(null);
      setHasMoreTransactions(false);
      setIsLoadingTransactions(false);
      setIsLoadingMoreTransactions(false);
      setTransactionsError(null);
      return;
    }
    if (!userId) {
        toast({ title: "Authentication Error", description: "User ID missing, cannot fetch transactions.", variant: "destructive" });
        if(initialLoad) setTransactions([]);
        setIsLoadingTransactions(false);
        setIsLoadingMoreTransactions(false);
        setTransactionsError("User ID missing for fetching transactions.");
        return;
    }
    console.log(`Fetching transactions for accountId: ${accountId}, userId: ${userId}, initialLoad: ${initialLoad}`);

    if (initialLoad) {
      setIsLoadingTransactions(true);
      setTransactions([]); // Clear previous transactions for the new account
      setTransactionsError(null); // Clear previous errors
      setLastLoadedDoc(null); // Reset pagination for new account
      setHasMoreTransactions(true); // Assume there might be more initially
    } else {
      setIsLoadingMoreTransactions(true);
    }

    try {
      const { transactions: newFirestoreTransactions, lastDoc: newLastDoc } = await getTransactionsByAccountId(accountId, userId, lastDoc, 10);
      const newUiTransactions = newFirestoreTransactions.map(mapFirestoreTransactionToUI);

      setTransactions(prev => initialLoad ? newUiTransactions : [...prev, ...newUiTransactions]);
      setLastLoadedDoc(newLastDoc);
      setHasMoreTransactions(newFirestoreTransactions.length === 10);

      if (initialLoad && newUiTransactions.length === 0 && accounts.length > 0 && !accountsError) {
         toast({
          title: "No Transactions",
          description: `No transactions found for ${accounts.find(acc => acc.id === accountId)?.name || 'the selected account'}. Add some!`,
          variant: "default"
        });
      }

    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      let errorMessage = error.message || "Could not fetch transactions.";
      toast({
        title: "Failed to Load Transactions",
        description: errorMessage,
        variant: "destructive",
      });
      if (initialLoad) setTransactions([]);
      setHasMoreTransactions(false);
      setTransactionsError(errorMessage);
    } finally {
      if (initialLoad) setIsLoadingTransactions(false);
      setIsLoadingMoreTransactions(false);
    }
  }, [toast, accounts, accountsError]); // accounts and accountsError added to deps for toast message context

  useEffect(() => {
    if (currentUser && currentUser.uid && selectedAccountId) {
        fetchTransactionsBatch(selectedAccountId, currentUser.uid, null, true); // Initial load for selected account
    } else if (!selectedAccountId && accounts.length > 0) {
        // If no account is selected but accounts exist, clear transactions (or select first as fetchAccounts does)
        setTransactions([]);
        setLastLoadedDoc(null);
        setHasMoreTransactions(true); // Or false, depending on desired state for "no account selected"
        setIsLoadingTransactions(false);
        setTransactionsError(null);
    }
  }, [selectedAccountId, currentUser, fetchTransactionsBatch, accounts.length]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    // Fetching transactions for the new accountId will be triggered by the useEffect watching selectedAccountId
  };

  const refreshData = useCallback((isAccountChange: boolean = false, newSelectedAccountId?: string) => {
    if (!currentUser || !currentUser.uid) {
        toast({ title: "Authentication Error", description: "Cannot refresh data, user not logged in.", variant: "destructive" });
        return;
    }
    console.log(`Refreshing data for userId: ${currentUser.uid}, isAccountChange: ${isAccountChange}, newSelectedAccountId: ${newSelectedAccountId}`);
    fetchAccounts(currentUser.uid).then((fetchedAccs) => {
        const currentFetchedAccounts = fetchedAccs || accounts; // Use fetchedAccs if available, otherwise current state

        let idToSelect = selectedAccountId;

        if (isAccountChange) { // If the refresh was triggered by an account CUD operation
          if (newSelectedAccountId && currentFetchedAccounts.find(a => a.id === newSelectedAccountId)) {
            idToSelect = newSelectedAccountId; // Select the newly added/edited account
          } else if (currentFetchedAccounts.length > 0 && !currentFetchedAccounts.find(a => a.id === selectedAccountId)) {
            // If current selection is gone (e.g., deleted) or wasn't set, default to first
            idToSelect = currentFetchedAccounts[0].id;
          } else if (currentFetchedAccounts.length === 0) {
            idToSelect = undefined; // No accounts left
          }
        } else { // If it's a general refresh (e.g. transaction added/updated/deleted)
            if (selectedAccountId && !currentFetchedAccounts.find(a => a.id === selectedAccountId)) {
                // If current selected account no longer exists (e.g. deleted in another tab)
                idToSelect = currentFetchedAccounts.length > 0 ? currentFetchedAccounts[0].id : undefined;
            } else if (!selectedAccountId && currentFetchedAccounts.length > 0) {
                // If no account was selected but now accounts exist
                idToSelect = currentFetchedAccounts[0].id;
            }
            // Otherwise, keep current idToSelect (which is selectedAccountId)
        }
        
        // Only update selectedAccountId if it actually changes to trigger the transaction fetch effect
        if (idToSelect !== selectedAccountId) {
            setSelectedAccountId(idToSelect);
        } else if (idToSelect && currentUser && currentUser.uid) {
            // If selectedAccountId didn't change but we still need to refresh its transactions
            fetchTransactionsBatch(idToSelect, currentUser.uid, null, true);
        } else if (!idToSelect) {
            setTransactions([]);
            setLastLoadedDoc(null);
            setHasMoreTransactions(false);
        }
        
        onDataChange(); // Propagate data change up to dashboard page
      });
  }, [currentUser, fetchAccounts, accounts, selectedAccountId, fetchTransactionsBatch, onDataChange, toast]);

  const handleEditTransaction = (transaction: UITransactionType) => {
    setEditingTransaction(transaction);
    setIsEditTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!currentUser || !currentUser.uid || !deletingTransactionId) {
      toast({ title: "Error", description: "User, user ID, or transaction ID missing for deletion.", variant: "destructive" });
      return;
    }
    try {
      await deleteTransaction(deletingTransactionId, currentUser.uid);
      toast({ title: "Success", description: "Transaction deleted successfully." });
      refreshData(); // Refresh transactions and summary
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      toast({ title: "Error Deleting Transaction", description: error.message || "Could not delete transaction.", variant: "destructive" });
    } finally {
      setIsDeleteTransactionDialogOpen(false);
      setDeletingTransactionId(null);
    }
  };

  const handleEditAccount = () => {
    if (!selectedAccountId) {
      toast({ title: "No Account Selected", description: "Please select an account to edit.", variant: "destructive" });
      return;
    }
    const account = accounts.find(acc => acc.id === selectedAccountId);
    if (account) {
      setEditingAccount(account);
      setIsEditAccountDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Selected account not found.", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.uid || !deletingAccountId) {
      toast({ title: "Error", description: "User, user ID, or account ID missing for deletion.", variant: "destructive" });
      return;
    }
    const accountToDeleteId = deletingAccountId; // Capture before resetting state
    try {
      await deleteAccountService(accountToDeleteId, currentUser.uid);
      toast({ title: "Success", description: "Account and its transactions deleted successfully." });

      // Determine the next selected account ID *before* calling refreshData
      const remainingAccounts = accounts.filter(acc => acc.id !== accountToDeleteId);
      let nextSelectedId: string | undefined = undefined;
      if (remainingAccounts.length > 0) {
          nextSelectedId = remainingAccounts[0].id;
      }
      
      // Explicitly set selectedAccountId to trigger effect if needed, then refreshData handles fetching
      setSelectedAccountId(nextSelectedId); 
      refreshData(true, nextSelectedId); 

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
      setIsEditAccountDialogOpen(false); // Close edit dialog first
      setDeletingAccountId(editingAccount.id);
      setIsDeleteAccountDialogOpen(true);
    }
  };

  const handleLoadMoreTransactions = () => {
    if (currentUser && currentUser.uid && selectedAccountId && hasMoreTransactions && !isLoadingMoreTransactions) {
      fetchTransactionsBatch(selectedAccountId, currentUser.uid, lastLoadedDoc, false);
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
                    <SelectValue placeholder={accountsError ? "Error loading accounts" : "Select account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 && !accountsError && <SelectItem value="no-accounts" disabled>No accounts found</SelectItem>}
                    {accountsError && <SelectItem value="error-accounts" disabled>Error loading accounts</SelectItem>}
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <account.icon className="h-4 w-4 text-muted-foreground" />
                          {account.name} ({account.accountNumberLast4})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleEditAccount} disabled={!selectedAccountId || isLoadingAccounts || isLoadingTransactions}>
                  <Edit3 className="h-4 w-4" />
                  <span className="sr-only">Edit Account</span>
                </Button>
              </div>
            )}
             <AddAccountDialog currentUser={currentUser} onAccountAdded={() => refreshData(true)} />
          </div>
        </div>
        <CardDescription className="mt-2">
          {!currentUser ? "Please log in to view your transactions." :
           accountsError ? <span className="text-destructive text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {accountsError}</span> :
           accounts.length === 0 && !isLoadingAccounts ? "Add an account to start tracking transactions." :
           transactionsError ? <span className="text-destructive text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {transactionsError}</span> :
           `Your latest financial activities for ${accounts.find(acc => acc.id === selectedAccountId)?.name || 'the selected account'}.`}
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
        ) : accountsError ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="font-semibold text-destructive">Failed to Load Accounts</p>
              <p className="text-sm text-muted-foreground mt-1">{accountsError}</p>
              <Button onClick={() => currentUser && fetchAccounts(currentUser.uid)} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
        ) : !selectedAccountId && accounts.length > 0 && !isLoadingAccounts ? (
            <div className="flex items-center justify-center h-[300px]">
             <p className="text-muted-foreground">Please select an account to view transactions.</p>
           </div>
        ) : transactionsError ? (
             <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <p className="font-semibold text-destructive">Failed to Load Transactions</p>
              <p className="text-sm text-muted-foreground mt-1">{transactionsError}</p>
              <Button onClick={() => currentUser && selectedAccountId && fetchTransactionsBatch(selectedAccountId, currentUser.uid, null, true)} variant="outline" className="mt-4">
                Try Again
              </Button>
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
                      {accounts.length === 0 && !isLoadingAccounts && !accountsError ? "No accounts available. Please add one." :
                       !selectedAccountId && !isLoadingAccounts && !accountsError ? "Select an account to see transactions." :
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
                      <TableCell className="font-medium flex items-center gap-2 break-words">
                        <Icon className="h-4 w-4 text-muted-foreground hidden sm:inline-block" />
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>{transaction.date}</TableCell>
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
            {hasMoreTransactions && !isLoadingMoreTransactions && (
              <div className="flex justify-center my-4">
                <Button onClick={handleLoadMoreTransactions} variant="outline">
                  Load More Transactions
                </Button>
              </div>
            )}
            {isLoadingMoreTransactions && (
              <div className="flex justify-center my-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading more...</span>
              </div>
            )}
            {currentUser && selectedAccountId && accounts.length > 0 && !accountsError && (
                 <div className="flex justify-center mt-4">
                    <AddTransactionDialog
                        currentUser={currentUser}
                        selectedAccountId={selectedAccountId}
                        allAccounts={accounts}
                        onTransactionAdded={() => refreshData()}
                    />
                </div>
            )}
            {!selectedAccountId && accounts.length === 0 && !isLoadingAccounts && !accountsError && currentUser && (
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
            refreshData(true, editingAccount?.id); // Pass true and the edited account ID
            setIsEditAccountDialogOpen(false);
            setEditingAccount(null);
          }}
          onInitiateDelete={handleInitiateDeleteFromEditDialog}
        />
      )}

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this account and all its associated transactions.
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
