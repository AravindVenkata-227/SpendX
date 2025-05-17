
"use client";

import { useState, useEffect } from 'react';
import type { Transaction as TransactionType } from "@/types";
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
  ShoppingBag,
  Home,
  Car,
  PiggyBank, // For a potential new category or just variety
  Landmark, // For bank/account related things
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

const ALL_MOCK_TRANSACTIONS: { [accountId: string]: TransactionType[] } = {
  acc1: [
    { id: '1', date: '2024-07-28', description: 'Supermarket Haul', category: 'Food', amount: -550.75, type: 'debit', icon: Utensils },
    { id: '2', date: '2024-07-27', description: 'Monthly Salary (Partial)', category: 'Income', amount: 25000, type: 'credit', icon: Briefcase },
    { id: '3', date: '2024-07-26', description: 'Electricity Provider Inc.', category: 'Bills', amount: -1200, type: 'debit', icon: FileText },
    { id: '4', date: '2024-07-25', description: 'Dinner at The Local Joint', category: 'Food', amount: -850, type: 'debit', icon: Utensils },
  ],
  acc2: [
    { id: '101', date: '2024-07-29', description: 'Rent Payment', category: 'Housing', amount: -20000, type: 'debit', icon: Home },
    { id: '102', date: '2024-07-28', description: 'Investment Dividend', category: 'Income', amount: 1200, type: 'credit', icon: Briefcase },
    { id: '103', date: '2024-07-27', description: 'Fuel for Car', category: 'Transport', amount: -3000, type: 'debit', icon: Car },
    { id: '104', date: '2024-07-26', description: 'Weekend Getaway Booking', category: 'Travel', amount: -8500, type: 'debit', icon: Plane },
  ],
  acc3: [
    { id: '201', date: '2024-07-30', description: 'Main Salary Credit', category: 'Income', amount: 75000, type: 'credit', icon: Briefcase },
    { id: '202', date: '2024-07-29', description: 'Online Course Subscription', category: 'Education', amount: -2500, type: 'debit', icon: BookOpen },
    { id: '203', date: '2024-07-28', description: 'New Headphones', category: 'Shopping', amount: -6000, type: 'debit', icon: ShoppingBag },
    { id: '204', date: '2024-07-27', description: 'Movie Tickets', category: 'Entertainment', amount: -750, type: 'debit', icon: Film },
  ],
};

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
};

interface ClientFormattedTransaction extends TransactionType {
  formattedDate: string;
}

export default function RecentTransactionsTableCard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(MOCK_ACCOUNTS[0]?.id);
  const [clientTransactions, setClientTransactions] = useState<ClientFormattedTransaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!selectedAccountId || !ALL_MOCK_TRANSACTIONS[selectedAccountId]) {
      setClientTransactions([]);
      return;
    }
    const rawTransactions = ALL_MOCK_TRANSACTIONS[selectedAccountId];
    const formatted = rawTransactions.map(t => ({
      ...t,
      formattedDate: new Date(t.date).toLocaleDateString()
    }));
    setClientTransactions(formatted);

    const selectedAccountName = MOCK_ACCOUNTS.find(acc => acc.id === selectedAccountId)?.name || 'Selected Account';
    toast({
      title: "Account Switched",
      description: `Displaying transactions for ${selectedAccountName}.`,
    });
  }, [selectedAccountId, toast]);

  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <div className="w-full sm:w-auto">
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
          </div>
        </div>
        <CardDescription className="mt-2">
          Your latest financial activities for the selected account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientTransactions.length === 0 && selectedAccountId && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No transactions found for this account.
                  </TableCell>
                </TableRow>
              )}
              {clientTransactions.map((transaction) => {
                const Icon = transaction.icon || categoryIcons[transaction.category] || FileText;
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
                  <TableCell>{transaction.formattedDate}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {transaction.type === 'debit' ? '-' : '+'}₹{Math.abs(transaction.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
