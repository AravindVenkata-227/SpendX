
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseISO, isValid } from 'date-fns';
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
  let formattedDate = transaction.date;
  try {
    const parsedDate = parseISO(transaction.date);
    if (isValid(parsedDate)) {
      formattedDate = parsedDate.toLocaleDateString();
    }
  } catch (e) {
    // Keep original date string if parsing fails
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
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingMoreTransactions, setIsLoadingMoreTransactions] = useState(false);

  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
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
        const currentSelectedExists = uiAccounts.some(acc => acc.id === selectedAccountId);
        if(!currentSelectedExists) {
          setSelectedAccountId(uiAccounts[0].id);
        }
      } else if (uiAccounts.length === 0) {
        setSelectedAccountId(undefined);
        setTransactions([]); 
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
        title: "Error Loading Accounts",
        description: toastMessage,
        variant: "destructive",
      });
      setAccounts([]);
      setSelectedAccountId(undefined);
      setTransactions([]); 
      setLastLoadedDoc(null);
      setHasMoreTransactions(false);
      return []; 
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
      setTransactions([]);
      setLastLoadedDoc(null);
      setHasMoreTransactions(true);
    }
  }, [currentUser, fetchAccounts]);


  const fetchTransactionsBatch = useCallback(async (accountId: string | undefined, userId: string, lastDoc: DocumentSnapshot | null, initialLoad: boolean = false) => {
    if (!accountId || !userId) {
      if(initialLoad) setTransactions([]);
      setLastLoadedDoc(null);
      setHasMoreTransactions(false);
      setIsLoadingTransactions(false);
      setIsLoadingMoreTransactions(false);
      return;
    }

    if (initialLoad) {
      setIsLoadingTransactions(true);
      setTransactions([]); // Clear previous transactions on initial load or account switch
    } else {
      setIsLoadingMoreTransactions(true);
    }

    try {
      const { transactions: newFirestoreTransactions, lastDoc: newLastDoc } = await getTransactionsByAccountId(accountId, userId, lastDoc);
      const newUiTransactions = newFirestoreTransactions.map(mapFirestoreTransactionToUI);
      
      setTransactions(prev => initialLoad ? newUiTransactions : [...prev, ...newUiTransactions]);
      setLastLoadedDoc(newLastDoc);
      setHasMoreTransactions(newFirestoreTransactions.length === 10); // Assuming page limit is 10

      if (initialLoad && newUiTransactions.length === 0 && accounts.length > 0) {
         toast({
          title: "No Transactions",
          description: `No transactions found for ${accounts.find(acc => acc.id === accountId)?.name || 'the selected account'}.`,
          variant: "default"
        });
      }

    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error Loading Transactions",
        description: error.message || "Could not fetch transactions.",
        variant: "destructive",
      });
      if (initialLoad) setTransactions([]);
      setHasMoreTransactions(false);
    } finally {
      if (initialLoad) setIsLoadingTransactions(false);
      setIsLoadingMoreTransactions(false);
    }
  }, [toast, accounts]);

  useEffect(() => {
    if (currentUser && selectedAccountId) {
        fetchTransactionsBatch(selectedAccountId, currentUser.uid, null, true); // Initial load
    } else if (!selectedAccountId && accounts.length === 0) { 
        setTransactions([]);
        setLastLoadedDoc(null);
        setHasMoreTransactions(true);
    }
  }, [selectedAccountId, currentUser, fetchTransactionsBatch, accounts.length]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    // Fetching will be triggered by the useEffect watching selectedAccountId
  };

  const refreshData = useCallback((isAccountChange: boolean = false, newSelectedAccountId?: string) => {
    if (currentUser) {
      fetchAccounts(currentUser.uid).then((fetchedAccs) => { 
        const currentFetchedAccounts = fetchedAccs || accounts; 
        
        let idToSelect = selectedAccountId;

        if (isAccountChange) {
          if (newSelectedAccountId && currentFetchedAccounts.find(a => a.id === newSelectedAccountId)) {
            idToSelect = newSelectedAccountId; 
          } else if (currentFetchedAccounts.length > 0 && !currentFetchedAccounts.find(a => a.id === selectedAccountId)) {
            idToSelect = currentFetchedAccounts[0].id; 
          } else if (currentFetchedAccounts.length === 0) {
            idToSelect = undefined;
          }
        }
        
        setSelectedAccountId(idToSelect); 

        if (idToSelect) { 
          fetchTransactionsBatch(idToSelect, currentUser.uid, null, true); // Full refresh for selected account
        } else {
          setTransactions([]); 
          setLastLoadedDoc(null);
          setHasMoreTransactions(false);
        }
        onDataChange(); 
      });
    }
  }, [currentUser, fetchAccounts, accounts, selectedAccountId, fetchTransactionsBatch, onDataChange]);
  
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
    const accountToDeleteId = deletingAccountId; 
    try {
      await deleteAccountService(accountToDeleteId, currentUser.uid);
      toast({ title: "Success", description: "Account deleted successfully." });
      
      const remainingAccounts = accounts.filter(acc => acc.id !== accountToDeleteId);
      let nextSelectedId: string | undefined = undefined;
      if (remainingAccounts.length > 0) {
        if (selectedAccountId === accountToDeleteId) { 
          nextSelectedId = remainingAccounts[0].id; 
        } else {
          nextSelectedId = selectedAccountId; 
        }
      }
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
      setIsEditAccountDialogOpen(false); 
      setDeletingAccountId(editingAccount.id); 
      setIsDeleteAccountDialogOpen(true); 
    }
  };

  const handleLoadMoreTransactions = () => {
    if (currentUser && selectedAccountId && hasMoreTransactions && !isLoadingMoreTransactions) {
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
              </div>
            )}
             <AddAccountDialog currentUser={currentUser} onAccountAdded={() => refreshData(true)} />
          </div>
        </div>
        <CardDescription className="mt-2">
          {!currentUser ? "Please log in to view your transactions." : 
           accounts.length === 0 && !isLoadingAccounts ? "Add an account to start tracking transactions." :
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
        ) : !selectedAccountId && accounts.length > 0 && !isLoadingAccounts ? ( 
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
                      {accounts.length === 0 && !isLoadingAccounts ? "No accounts available. Please add one." :
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
            {currentUser && selectedAccountId && accounts.length > 0 && (
                 <div className="flex justify-center mt-4">
                    <AddTransactionDialog 
                        currentUser={currentUser} 
                        selectedAccountId={selectedAccountId} 
                        allAccounts={accounts}
                        onTransactionAdded={() => refreshData()}
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
            refreshData(true, editingAccount?.id); 
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
