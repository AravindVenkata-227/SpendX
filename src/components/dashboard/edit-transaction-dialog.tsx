
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
import { updateTransaction } from '@/services/transactionService';
import type { User } from 'firebase/auth';
import { TransactionCategories, type TransactionCategory, type UITransactionType, type TransactionUpdateData } from '@/types';
import { Loader2, Calendar as CalendarIcon, Utensils, FileText, ShoppingCart, Briefcase, Film, Car, BookOpen, Home, PiggyBank, Landmark, CreditCard, CircleDollarSign, HeartPulse, Building, Gift, Plane, TrendingUp } from 'lucide-react';
import { format, parse, isValid, parseISO } from 'date-fns';
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

interface EditTransactionDialogProps {
  currentUser: User | null;
  transactionToEdit: UITransactionType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: () => void;
  accountName?: string;
}

export default function EditTransactionDialog({ currentUser, transactionToEdit, open, onOpenChange, onTransactionUpdated, accountName }: EditTransactionDialogProps) {
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

  useEffect(() => {
    if (transactionToEdit && open) {
      let transactionDate: Date | null = new Date();
      let dateToParse = transactionToEdit.date;
      if (transactionToEdit.date.includes('/')) {
         const parts = transactionToEdit.date.split('/');
         if (parts.length === 3) {
            dateToParse = `${parts[2]}-${parts[1]}-${parts[0]}`;
         }
      }

      const finalParsedDate = parseISO(dateToParse);

      if (isValid(finalParsedDate)) {
        transactionDate = finalParsedDate;
      } else {
        console.warn("Invalid date string from transactionToEdit after attempting parse:", transactionToEdit.date, ". Defaulting to today.");
        transactionDate = new Date();
      }

      form.reset({
        description: transactionToEdit.description,
        amount: Math.abs(transactionToEdit.amount),
        type: transactionToEdit.type,
        category: transactionToEdit.category as TransactionCategory,
        date: transactionDate,
      });
    }
  }, [transactionToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !transactionToEdit) {
      toast({ title: "Error", description: "User or transaction not available.", variant: "destructive" });
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

      const updateData: TransactionUpdateData = {
        description: values.description,
        amount: transactionAmount,
        type: values.type,
        category: values.category,
        date: format(values.date, 'yyyy-MM-dd'),
        iconName: iconName,
      };

      await updateTransaction(transactionToEdit.id, currentUser.uid, updateData);
      toast({ title: "Success", description: "Transaction updated successfully." });
      onTransactionUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({ title: "Error updating transaction", description: error.message || "Could not update transaction.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogDescription = accountName
    ? `Edit transaction details for account: ${accountName}.`
    : "Edit transaction details.";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="description-edit">Description</Label>
            <Input id="description-edit" placeholder="e.g., Coffee, Salary" {...form.register('description')} disabled={isLoading} className="mt-1" />
            {form.formState.errors.description && <p className="text-xs text-red-500 mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount-edit">Amount (₹)</Label>
              <Input id="amount-edit" type="number" step="0.01" placeholder="0.00" {...form.register('amount')} disabled={isLoading} className="mt-1" />
              {form.formState.errors.amount && <p className="text-xs text-red-500 mt-1">{form.formState.errors.amount.message}</p>}
            </div>
            <div>
              <Label>Type</Label>
              <RadioGroup
                value={form.watch('type')}
                onValueChange={(value) => form.setValue('type', value as 'debit' | 'credit')}
                className="flex items-center space-x-2 mt-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="debit" id="debit-edit" />
                  <Label htmlFor="debit-edit" className="font-normal">Debit</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="credit" id="credit-edit" />
                  <Label htmlFor="credit-edit" className="font-normal">Credit</Label>
                </div>
              </RadioGroup>
              {form.formState.errors.type && <p className="text-xs text-red-500 mt-1">{form.formState.errors.type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category-edit">Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) => form.setValue('category', value as TransactionCategory)}
                disabled={isLoading}
              >
                <SelectTrigger id="category-edit" className="mt-1">
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
              <Label htmlFor="date-edit">Date</Label>
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
