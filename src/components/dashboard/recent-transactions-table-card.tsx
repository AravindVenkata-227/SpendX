
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
import { Button } from "@/components/ui/button"; // Added
import { useToast } from "@/hooks/use-toast"; // Added
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  ShoppingCart, 
  Utensils, 
  FileText, 
  Briefcase,
  BookOpen,  // Added for new categories/icons
  Film,      // Added
  Plane,     // Added
  ShoppingBag, // Added
  Home,      // Added
  Car        // Added
} from "lucide-react";
import { cn } from "@/lib/utils";

const account1Transactions: TransactionType[] = [
  { id: '1', date: '2024-07-28', description: 'Supermarket Haul', category: 'Food', amount: -550.75, type: 'debit', icon: Utensils },
  { id: '2', date: '2024-07-27', description: 'Monthly Salary', category: 'Income', amount: 50000, type: 'credit', icon: Briefcase },
  { id: '3', date: '2024-07-26', description: 'Electricity Provider Inc.', category: 'Bills', amount: -1200, type: 'debit', icon: FileText },
  { id: '4', date: '2024-07-25', description: 'Dinner at The Local Joint', category: 'Food', amount: -850, type: 'debit', icon: Utensils },
  { id: '5', date: '2024-07-24', description: 'New T-Shirt', category: 'Shopping', amount: -1200, type: 'debit', icon: ShoppingCart },
  { id: '6', date: '2024-07-23', description: 'Freelance Project Payment', category: 'Income', amount: 15000, type: 'credit', icon: Briefcase },
];

const account2Transactions: TransactionType[] = [
  { id: '101', date: '2024-07-29', description: 'Rent Payment', category: 'Housing', amount: -20000, type: 'debit', icon: Home },
  { id: '102', date: '2024-07-28', description: 'Investment Dividend', category: 'Income', amount: 1200, type: 'credit', icon: Briefcase },
  { id: '103', date: '2024-07-27', description: 'Fuel for Car', category: 'Transport', amount: -3000, type: 'debit', icon: Car },
  { id: '104', date: '2024-07-26', description: 'Weekend Getaway Booking', category: 'Travel', amount: -8500, type: 'debit', icon: Plane },
  { id: '105', date: '2024-07-25', description: 'Groceries - Organic Mart', category: 'Food', amount: -4500, type: 'debit', icon: Utensils },
  { id: '106', date: '2024-07-24', description: 'Online Shopping - Gadget', category: 'Shopping', amount: -7000, type: 'debit', icon: ShoppingBag },
  { id: '107', date: '2024-07-23', description: 'University Course Fees', category: 'Education', amount: -15000, type: 'debit', icon: BookOpen },
  { id: '108', date: '2024-07-22', description: 'Concert Tickets', category: 'Entertainment', amount: -3500, type: 'debit', icon: Film },
];

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Bills: FileText,
  Shopping: ShoppingCart, // Default for Shopping
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
  const [clientTransactions, setClientTransactions] = useState<ClientFormattedTransaction[]>([]);
  const [currentAccountSource, setCurrentAccountSource] = useState<'account1' | 'account2'>('account1');
  const { toast } = useToast();

  useEffect(() => {
    // Load and format transactions based on the current source, client-side
    const rawTransactions = currentAccountSource === 'account1' ? account1Transactions : account2Transactions;
    
    const formatted = rawTransactions.map(t => ({
      ...t,
      formattedDate: new Date(t.date).toLocaleDateString() // Formatted client-side
    }));
    setClientTransactions(formatted);
  }, [currentAccountSource]); // Re-run when data source changes

  const handleSyncTransactions = () => {
    const nextAccountSource = currentAccountSource === 'account1' ? 'account2' : 'account1';
    setCurrentAccountSource(nextAccountSource);
    toast({
      title: "Transactions Synced",
      description: `Displaying transactions for ${nextAccountSource === 'account1' ? "Account 1" : "Account 2"}.`,
    });
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <CardTitle>Recent Transactions</CardTitle>
          </div>
          <Button onClick={handleSyncTransactions} size="sm" variant="outline">
            Sync Transactions
          </Button>
        </div>
        <CardDescription>Your latest financial activities. Click Sync to switch accounts.</CardDescription>
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
