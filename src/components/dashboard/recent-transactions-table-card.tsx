
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
import { ArrowDownCircle, ArrowUpCircle, History, ShoppingCart, Utensils, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const initialTransactions: TransactionType[] = [
  { id: '1', date: '2024-07-28', description: 'Supermarket Haul', category: 'Food', amount: -550.75, type: 'debit', icon: Utensils },
  { id: '2', date: '2024-07-27', description: 'Monthly Salary', category: 'Income', amount: 50000, type: 'credit', icon: Briefcase },
  { id: '3', date: '2024-07-26', description: 'Electricity Provider Inc.', category: 'Bills', amount: -1200, type: 'debit', icon: FileText },
  { id: '4', date: '2024-07-25', description: 'Dinner at The Local Joint', category: 'Food', amount: -850, type: 'debit', icon: Utensils },
  { id: '5', date: '2024-07-24', description: 'New T-Shirt', category: 'Shopping', amount: -1200, type: 'debit', icon: ShoppingCart },
  { id: '6', date: '2024-07-23', description: 'Freelance Project Payment', category: 'Income', amount: 15000, type: 'credit', icon: Briefcase },
];

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Bills: FileText,
  Shopping: ShoppingCart,
  Income: Briefcase,
  Entertainment: FileText, 
  Transport: FileText, 
};

interface ClientFormattedTransaction extends TransactionType {
  formattedDate: string;
}

export default function RecentTransactionsTableCard() {
  const [transactions, setTransactions] = useState<ClientFormattedTransaction[]>([]);

  useEffect(() => {
    const formatted = initialTransactions.map(t => ({
      ...t,
      formattedDate: new Date(t.date).toLocaleDateString()
    }));
    setTransactions(formatted);
  }, []); // Runs once on the client after hydration

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <CardTitle>Recent Transactions</CardTitle>
        </div>
        <CardDescription>Your latest financial activities.</CardDescription>
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
              {transactions.map((transaction) => {
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
