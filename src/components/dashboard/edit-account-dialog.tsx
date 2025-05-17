
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateAccount } from '@/services/accountService';
import type { User } from 'firebase/auth';
import { AccountTypes, type AccountType, type UIAccount, type AccountUpdateData } from '@/types';
import { Loader2, Trash2, Hash } from 'lucide-react';

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
    .length(4, { message: "Must be 4 digits." })
    .regex(/^\d{4}$/, { message: "Must be 4 digits." }),
});

interface EditAccountDialogProps {
  currentUser: User | null;
  accountToEdit: UIAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountUpdated: () => void;
  onInitiateDelete: () => void; 
}

export default function EditAccountDialog({ currentUser, accountToEdit, open, onOpenChange, onAccountUpdated, onInitiateDelete }: EditAccountDialogProps) {
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

  useEffect(() => {
    if (accountToEdit && open) {
      form.reset({
        name: accountToEdit.name,
        type: accountToEdit.type,
        accountNumberLast4: accountToEdit.accountNumberLast4 || '', // Ensure it defaults to string if null/undefined
      });
    }
  }, [accountToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !accountToEdit) {
      toast({ title: "Error", description: "User or account not available for update.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const iconName = accountTypeToIconMap[values.type as AccountType];
      const updateData: AccountUpdateData = {
        name: values.name,
        type: values.type as AccountType,
        iconName: iconName,
        accountNumberLast4: values.accountNumberLast4, // Now mandatory and will be a string
      };
      await updateAccount(accountToEdit.id, currentUser.uid, updateData);
      toast({ title: "Success", description: "Account updated successfully." });
      onAccountUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast({ title: "Error", description: error.message || "Could not update account.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (!isLoading) {
      onInitiateDelete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
         if (!isOpen) form.reset(); // Reset form if dialog is closed
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update the details for your financial account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name-edit">Account Name</Label>
            <Input
              id="name-edit"
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
            <Label htmlFor="type-edit">Account Type</Label>
            <Select
              onValueChange={(value) => form.setValue('type', value as AccountType)}
              value={form.watch('type')} 
              disabled={isLoading}
            >
              <SelectTrigger id="type-edit" className="mt-1">
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
            <Label htmlFor="accountNumberLast4-edit">Account Number (Last 4 Digits)</Label>
            <div className="relative mt-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountNumberLast4-edit"
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
          <DialogFooter className="justify-between sm:justify-between"> 
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteClick} 
              disabled={isLoading}
              className="sm:mr-auto" 
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
            <div className="flex gap-2 mt-2 sm:mt-0"> 
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
