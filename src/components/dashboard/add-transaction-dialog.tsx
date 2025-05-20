
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { addTransaction } from '@/services/transactionService';
import type { User } from 'firebase/auth';
import { TransactionCategories, type TransactionCategory, type UIAccount } from '@/types';
import { Loader2, PlusCircle, Calendar as CalendarIcon, Utensils, FileText, ShoppingCart, Briefcase, Film, Car, BookOpen, Home, PiggyBank, Landmark, CreditCard, CircleDollarSign, HeartPulse, Building, Gift, Plane, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryToIconMap: Record<TransactionCategory, string> = {
  "Food": "Utensils",
  "Groceries": "ShoppingCart",
  "Bills": "FileText",
  "Utilities": "FileText",
  "Rent/Mortgage": "Home",
  "Transport": "Car",
  "Shopping": "ShoppingCart",
  "Entertainment": "Film",
  "Health": "HeartPulse",
  "Education": "BookOpen",
  "Income": "Briefcase",
  "Investment": "TrendingUp",
  "Travel": "Plane",
  "Gifts": "Gift",
  "Other": "CircleDollarSign",
};


const formSchema = z.object({
  description: z.string().min(2, { message: "Description must be at least 2 characters." }).max(100),
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(['debit', 'credit'], { required_error: "Please select transaction type." }),
  category: z.enum(TransactionCategories, { required_error: "Please select a category." }),
  date: z.date({ required_error: "Please select a date." }).nullable(),
});

interface AddTransactionDialogProps {
  currentUser: User | null;
  selectedAccountId: string | undefined;
  allAccounts: UIAccount[];
  onTransactionAdded: () => void;
}

export default function AddTransactionDialog({ currentUser, selectedAccountId, allAccounts, onTransactionAdded }: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'debit',
      category: undefined,
      date: new Date(),
    },
  });

  const selectedAccount = allAccounts.find(acc => acc.id === selectedAccountId);
  const accountDisplayName = selectedAccount ? `${selectedAccount.name} (${selectedAccount.type})` : "the selected account";

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!selectedAccountId) {
      toast({ title: "Error", description: "Please select an account first.", variant: "destructive" });
      return;
    }
    if (!values.date) {
      toast({ title: "Error", description: "Please select a transaction date.", variant: "destructive" });
      form.setError("date", { type: "manual", message: "Date is required." });
      return;
    }

    setIsLoading(true);
    try {
      const transactionAmount = values.type === 'debit' ? -Math.abs(values.amount) : Math.abs(values.amount);
      const iconName = categoryToIconMap[values.category as TransactionCategory] || "CircleDollarSign";

      await addTransaction({
        userId: currentUser.uid,
        accountId: selectedAccountId,
        description: values.description,
        amount: transactionAmount,
        type: values.type,
        category: values.category,
        date: format(values.date, 'yyyy-MM-dd'),
        iconName: iconName,
      });
      toast({ title: "Success", description: "Transaction added successfully." });
      onTransactionAdded();
      setOpen(false);
      form.reset({ date: new Date(), type: 'debit', amount: 0, description: '', category: undefined });
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast({ title: "Error", description: error.message || "Could not add transaction.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.reset({
        description: '',
        amount: 0,
        type: 'debit',
        category: undefined,
        date: new Date(),
      });
    }
  }, [open, form]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full sm:w-auto"
          disabled={!currentUser || !selectedAccountId || allAccounts.length === 0 || isLoading}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter transaction details for {accountDisplayName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="e.g., Coffee, Salary" {...form.register('description')} disabled={isLoading} className="mt-1" />
            {form.formState.errors.description && <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" {...form.register('amount')} disabled={isLoading} className="mt-1" />
              {form.formState.errors.amount && <p className="text-xs text-red-500 mt-1">{form.formState.errors.amount.message}</p>}
            </div>
            <div>
              <Label>Type</Label>
              <RadioGroup
                defaultValue="debit"
                onValueChange={(value) => form.setValue('type', value as 'debit' | 'credit')}
                className="flex items-center space-x-2 mt-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="debit" id="debit" />
                  <Label htmlFor="debit" className="font-normal">Debit</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="font-normal">Credit</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.type && <p className="text-xs text-red-500 mt-1">{form.formState.errors.type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                onValueChange={(value) => form.setValue('category', value as TransactionCategory)}
                defaultValue={form.getValues('category')}
                disabled={isLoading}
              >
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TransactionCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-xs text-red-500 mt-1">{form.formState.errors.category.message}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal mt-1", !form.watch('date') && "text-muted-foreground")}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('date') ? format(form.watch('date')!, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => form.setValue('date', date || null)}
                    initialFocus
                    disabled={isLoading}
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && <p className="text-xs text-red-500 mt-1">{form.formState.errors.date.message}</p>}
            </div>
          </div>

          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                </Button>
             </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
