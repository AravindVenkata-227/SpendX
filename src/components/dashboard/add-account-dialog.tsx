
"use client";

import { useState } from 'react';
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addAccount } from '@/services/accountService';
import type { User } from 'firebase/auth';
import { AccountTypes, type AccountType } from '@/types';
import { Loader2, PlusCircle, PiggyBank, Landmark, CreditCard, Briefcase, TrendingUp, ShieldQuestion, Hash } from 'lucide-react';

const accountTypeToIconMap: Record<AccountType, string> = {
  "Savings": "PiggyBank",
  "Checking": "Landmark",
  "Credit Card": "CreditCard",
  "Investment": "TrendingUp",
  "Loan": "Briefcase",
  "Other": "ShieldQuestion",
};

const formSchema = z.object({
  name: z.string().min(2, { message: "Account name must be at least 2 characters." }).max(50),
  type: z.enum(AccountTypes, { required_error: "Please select an account type." }),
  accountNumberLast4: z.string()
    .length(4, { message: "Must be 4 digits if provided." })
    .regex(/^\d{4}$/, { message: "Must be 4 digits if provided." })
    .optional()
    .or(z.literal('')), // Allows empty string
});

interface AddAccountDialogProps {
  currentUser: User | null;
  onAccountAdded: () => void; // Callback to refresh accounts list
}

export default function AddAccountDialog({ currentUser, onAccountAdded }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: undefined,
      accountNumberLast4: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add an account.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const iconName = accountTypeToIconMap[values.type as AccountType];
      const accountData: any = {
        userId: currentUser.uid,
        name: values.name,
        type: values.type as AccountType,
        iconName: iconName,
      };
      if (values.accountNumberLast4 && values.accountNumberLast4.trim() !== '') {
        accountData.accountNumberLast4 = values.accountNumberLast4;
      }

      await addAccount(accountData);
      toast({ title: "Success", description: "Account added successfully." });
      onAccountAdded(); 
      setOpen(false); 
      form.reset(); 
    } catch (error: any) {
      console.error("Error adding account:", error);
      toast({ title: "Error", description: error.message || "Could not add account.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto" disabled={!currentUser || isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Enter the details for your new financial account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Primary Savings, Everyday Card"
              {...form.register('name')}
              disabled={isLoading}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="type">Account Type</Label>
            <Select
              onValueChange={(value) => form.setValue('type', value as AccountType)}
              defaultValue={form.getValues('type')}
              disabled={isLoading}
            >
              <SelectTrigger id="type" className="mt-1">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {AccountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.type.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="accountNumberLast4">Account Number (Last 4 Digits - Optional)</Label>
             <div className="relative mt-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountNumberLast4"
                  placeholder="1234"
                  {...form.register('accountNumberLast4')}
                  disabled={isLoading}
                  className="pl-10"
                  maxLength={4}
                />
            </div>
            {form.formState.errors.accountNumberLast4 && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.accountNumberLast4.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
