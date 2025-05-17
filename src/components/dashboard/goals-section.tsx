
"use client";

import { useState, useEffect, useCallback } from 'react';
import GoalProgressItemCard, { AddGoalCard } from "@/components/dashboard/goal-progress-item-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UIGoal, Goal as FirestoreGoal } from "@/types";
import { getGoalsByUserId } from '@/services/goalService'; // Assuming you create this
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Plane, Smartphone, ShieldAlert, Target, Home, BookOpen, Car, Loader2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from '../ui/button'; // For a potential "Add Sample Goal" button

// Mapping for icon names to Lucide components
const goalIcons: { [key: string]: React.ElementType } = {
  Plane,
  Smartphone,
  ShieldAlert,
  Home,
  BookOpen,
  Car,
  ShoppingBag,
  Default: Target, // Fallback icon
};

const mapFirestoreGoalToUIGoal = (firestoreGoal: FirestoreGoal): UIGoal => {
  const IconComponent = goalIcons[firestoreGoal.iconName] || goalIcons.Default;
  return {
    id: firestoreGoal.id,
    userId: firestoreGoal.userId,
    name: firestoreGoal.name,
    targetAmount: firestoreGoal.targetAmount,
    savedAmount: firestoreGoal.savedAmount,
    icon: IconComponent,
  };
};


export default function GoalsSection() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<UIGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setGoals([]);
        setIsLoading(false);
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
      if (firestoreGoals.length === 0) {
        toast({
          title: "No Savings Goals",
          description: "You haven't set any savings goals yet. Click 'Add New Goal' to start!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      toast({
        title: "Error Loading Goals",
        description: "Could not fetch your savings goals. Please try again later.",
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
    } else {
      // Clear goals if user logs out
      setGoals([]);
      setIsLoading(false);
    }
  }, [currentUser, fetchGoals]);
  
  // Placeholder for adding a new goal - to be implemented with a dialog/form
  const handleAddGoal = () => {
    toast({
        title: "Feature Coming Soon!",
        description: "The ability to add new goals is under development.",
    });
    // Example: Manually add a goal to Firestore for testing (remove in production)
    // if (currentUser) {
    //   addGoal({ 
    //     userId: currentUser.uid, 
    //     name: 'Test Goal from UI', 
    //     targetAmount: 1000, 
    //     savedAmount: 100, 
    //     iconName: 'Car' 
    //   }).then(() => fetchGoals(currentUser.uid));
    // }
  };


  return (
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
           <div className="flex items-center justify-center h-[200px]">
             <p className="text-muted-foreground">Login to see your savings goals.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {goals.length > 0 ? (
                goals.map((goal) => (
                <GoalProgressItemCard key={goal.id} goal={goal} />
                ))
            ) : (
                !isLoading && <p className="text-center text-muted-foreground py-4">No goals set yet. Click below to add one!</p>
            )}
            <div onClick={handleAddGoal}> {/* Make AddGoalCard clickable */}
                <AddGoalCard />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
