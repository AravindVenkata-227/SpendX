
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
import { updateGoal } from '@/services/goalService';
import type { User } from 'firebase/auth';
import { GoalIcons, type GoalIconName, type UIGoal, type GoalUpdateData } from '@/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Goal name must be at least 2 characters." }).max(50),
  targetAmount: z.coerce.number().positive({ message: "Target amount must be positive." }),
  savedAmount: z.coerce.number().min(0, {message: "Saved amount cannot be negative."}),
  iconName: z.custom<GoalIconName>((val) => GoalIcons.some(icon => icon.iconName === val), {
    message: "Please select a valid icon.",
  }),
});

interface EditGoalDialogProps {
  currentUser: User | null;
  goal: UIGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalUpdated: () => void;
}

export default function EditGoalDialog({ currentUser, goal, open, onOpenChange, onGoalUpdated }: EditGoalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      savedAmount: 0,
      iconName: GoalIcons[0].iconName,
    },
  });

  useEffect(() => {
    if (goal && open) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        iconName: GoalIcons.find(gi => gi.icon === goal.icon)?.iconName || GoalIcons[0].iconName,
      });
    }
  }, [goal, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentUser || !goal) {
      toast({ title: "Error", description: "User or goal not available for update.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const updateData: GoalUpdateData = {
        name: values.name,
        targetAmount: values.targetAmount,
        savedAmount: values.savedAmount,
        iconName: values.iconName,
      };
      await updateGoal(goal.id, currentUser.uid, updateData);
      toast({ title: "Success", description: "Goal updated successfully." });
      onGoalUpdated();
      onOpenChange(false); 
    } catch (error: any) {
      console.error("Error updating goal:", error);
      toast({ title: "Error", description: error.message || "Could not update goal.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isLoading) {
        onOpenChange(isOpen);
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Savings Goal</DialogTitle>
          <DialogDescription>
            Update the details for your savings goal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
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
              {...form.register('targetAmount')}
              disabled={isLoading}
              className="mt-1"
            />
            {form.formState.errors.targetAmount && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.targetAmount.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="savedAmount">Current Saved Amount (₹)</Label>
            <Input
              id="savedAmount"
              type="number"
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
              value={form.watch('iconName')} // Use value prop for controlled component
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
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
