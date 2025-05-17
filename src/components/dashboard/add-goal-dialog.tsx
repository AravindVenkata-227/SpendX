
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
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addGoal } from '@/services/goalService';
import type { User } from 'firebase/auth';
import { GoalIcons, type GoalIconName } from '@/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Goal name must be at least 2 characters." }).max(50),
  targetAmount: z.coerce.number().positive({ message: "Target amount must be positive." }),
  savedAmount: z.coerce.number().min(0, {message: "Saved amount cannot be negative."}).optional().default(0),
  iconName: z.custom<GoalIconName>((val) => GoalIcons.some(icon => icon.iconName === val), {
    message: "Please select a valid icon.",
  }),
});

interface AddGoalDialogProps {
  currentUser: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalAdded: () => void;
}

export default function AddGoalDialog({ currentUser, open, onOpenChange, onGoalAdded }: AddGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: undefined,
      savedAmount: 0,
      iconName: GoalIcons[0].iconName, // Default to the first icon
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to add a goal.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await addGoal({
        userId: currentUser.uid,
        name: values.name,
        targetAmount: values.targetAmount,
        savedAmount: values.savedAmount || 0,
        iconName: values.iconName,
      });
      toast({ title: "Success", description: "Goal added successfully." });
      onGoalAdded();
      onOpenChange(false); // Close dialog on success
      form.reset({ name: '', targetAmount: undefined, savedAmount: 0, iconName: GoalIcons[0].iconName });
    } catch (error: any) {
      console.error("Error adding goal:", error);
      toast({ title: "Error", description: error.message || "Could not add goal.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) { // Prevent closing while loading
        onOpenChange(isOpen);
        if (!isOpen) {
          form.reset({ name: '', targetAmount: undefined, savedAmount: 0, iconName: GoalIcons[0].iconName });
        }
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Savings Goal</DialogTitle>
          <DialogDescription>
            Set up a new goal you want to save towards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              placeholder="e.g., Vacation to Bali, New Laptop"
              {...form.register('name')}
              disabled={isLoading}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="targetAmount">Target Amount (₹)</Label>
            <Input
              id="targetAmount"
              type="number"
              placeholder="50000"
              {...form.register('targetAmount')}
              disabled={isLoading}
              className="mt-1"
            />
            {form.formState.errors.targetAmount && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.targetAmount.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="savedAmount">Initial Saved Amount (₹) (Optional)</Label>
            <Input
              id="savedAmount"
              type="number"
              placeholder="0"
              {...form.register('savedAmount')}
              disabled={isLoading}
              className="mt-1"
            />
            {form.formState.errors.savedAmount && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.savedAmount.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="iconName">Icon</Label>
            <Select
              onValueChange={(value) => form.setValue('iconName', value as GoalIconName)}
              defaultValue={form.getValues('iconName')}
              disabled={isLoading}
            >
              <SelectTrigger id="iconName" className="mt-1">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {GoalIcons.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  return (
                    <SelectItem key={iconOption.iconName} value={iconOption.iconName}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {iconOption.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {form.formState.errors.iconName && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.iconName.message}</p>
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
              {isLoading ? 'Adding Goal...' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
