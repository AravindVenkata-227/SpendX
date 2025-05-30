
"use client";

import { useState, useEffect, useCallback } from 'react';
import GoalProgressItemCard, { AddGoalCard } from "@/components/dashboard/goal-progress-item-card";
import AddGoalDialog from "@/components/dashboard/add-goal-dialog";
import EditGoalDialog from "@/components/dashboard/edit-goal-dialog"; // Import EditGoalDialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UIGoal, Goal as FirestoreGoal } from "@/types";
import { getGoalsByUserId, deleteGoal } from '@/services/goalService';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Plane, Smartphone, Target, Home, BookOpen, Car, Loader2, ShoppingBag, Gift, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const goalIconComponents: { [key: string]: React.ElementType } = {
  Plane, Smartphone, ShieldCheck, Home, BookOpen, Car, ShoppingBag, Gift, Target,
  // Ensure "ShieldAlert" is mapped if it was ever used or might be in old data
  ShieldAlert: ShieldCheck, 
};

const mapFirestoreGoalToUIGoal = (firestoreGoal: FirestoreGoal): UIGoal => {
  const iconKey = firestoreGoal.iconName === "ShieldAlert" ? "ShieldCheck" : firestoreGoal.iconName;
  const IconComponent = goalIconComponents[iconKey] || goalIconComponents.Target;
  return {
    id: firestoreGoal.id,
    userId: firestoreGoal.userId,
    name: firestoreGoal.name,
    targetAmount: firestoreGoal.targetAmount,
    savedAmount: firestoreGoal.savedAmount,
    icon: IconComponent,
    createdAt: firestoreGoal.createdAt,
  };
};

export default function GoalsSection() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<UIGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownNoGoalsToast, setHasShownNoGoalsToast] = useState(false);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UIGoal | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setGoals([]);
        setIsLoading(false);
        setHasShownNoGoalsToast(false); 
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchGoals = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const firestoreGoals = await getGoalsByUserId(userId);
      const uiGoals = firestoreGoals.map(mapFirestoreGoalToUIGoal);
      setGoals(uiGoals);
    } catch (error: any) {
      console.error("Failed to fetch goals in component:", error);
      toast({
        title: "Error Loading Goals",
        description: error.message || "Could not fetch your savings goals. Please check server logs for specific Firebase errors (e.g., permissions or missing indexes).",
        variant: "destructive",
      });
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]); 

  useEffect(() => {
    if (currentUser) {
      fetchGoals(currentUser.uid);
      setHasShownNoGoalsToast(false); // Reset toast flag when user changes or logs in
    } else {
      setIsLoading(false);
      setGoals([]);
    }
  }, [currentUser, fetchGoals]);

  useEffect(() => {
    if (!isLoading && currentUser && goals.length === 0 && !hasShownNoGoalsToast) {
      toast({
        title: "No Savings Goals",
        description: "You haven't set any savings goals yet. Click 'Add New Goal' to start!",
        variant: "default"
      });
      setHasShownNoGoalsToast(true);
    }
  }, [isLoading, currentUser, goals, hasShownNoGoalsToast, toast]);

  const handleAddGoalClick = () => {
    if (currentUser) {
      setIsAddGoalDialogOpen(true);
    } else {
      toast({ title: "Login Required", description: "Please log in to add a new goal.", variant: "destructive" });
    }
  };

  const handleGoalAddedOrUpdated = () => {
    if (currentUser) {
      fetchGoals(currentUser.uid);
      setHasShownNoGoalsToast(false);
    }
  };

  const handleEditGoal = (goal: UIGoal) => {
    setEditingGoal(goal);
    setIsEditGoalDialogOpen(true);
  };

  const handleDeleteGoalClick = (goalId: string) => {
    setGoalToDeleteId(goalId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!currentUser || !goalToDeleteId) return;
    try {
      await deleteGoal(goalToDeleteId, currentUser.uid);
      toast({ title: "Success", description: "Goal deleted successfully." });
      handleGoalAddedOrUpdated(); // Re-fetch goals
    } catch (error: any) {
      console.error("Error deleting goal:", error);
      toast({ title: "Error", description: error.message || "Could not delete goal.", variant: "destructive" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setGoalToDeleteId(null);
    }
  };

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle>Savings Goals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading goals...</p>
            </div>
          ) : !currentUser ? (
            <div className="flex flex-col items-center justify-center h-[200px]">
              <p className="text-muted-foreground">Login to see your savings goals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.length > 0 ? (
                goals.map((goal) => (
                  <GoalProgressItemCard 
                    key={goal.id} 
                    goal={goal} 
                    onEdit={handleEditGoal} 
                    onDelete={handleDeleteGoalClick}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No goals set yet. Click below to add one!</p>
              )}
              <div onClick={handleAddGoalClick} className="cursor-pointer">
                <AddGoalCard />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentUser && (
        <AddGoalDialog
          currentUser={currentUser}
          open={isAddGoalDialogOpen}
          onOpenChange={setIsAddGoalDialogOpen}
          onGoalAdded={handleGoalAddedOrUpdated}
        />
      )}

      {currentUser && editingGoal && (
        <EditGoalDialog
          currentUser={currentUser}
          goal={editingGoal}
          open={isEditGoalDialogOpen}
          onOpenChange={(open) => {
            setIsEditGoalDialogOpen(open);
            if (!open) setEditingGoal(null); // Clear editing goal when dialog closes
          }}
          onGoalUpdated={handleGoalAddedOrUpdated}
        />
      )}

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your savings goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setGoalToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGoal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
