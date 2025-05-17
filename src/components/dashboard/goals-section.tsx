
"use client";

import { useState, useEffect, useCallback } from 'react';
import GoalProgressItemCard, { AddGoalCard } from "@/components/dashboard/goal-progress-item-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UIGoal, Goal as FirestoreGoal } from "@/types";
import { getGoalsByUserId } from '@/services/goalService';
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Plane, Smartphone, ShieldAlert, Target, Home, BookOpen, Car, Loader2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { addGoal } from '@/services/goalService'; // For testing, normally remove

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
    createdAt: firestoreGoal.createdAt, // Keep createdAt if needed for display or sorting on UI
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
        setGoals([]); // Clear goals if user logs out
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
      if (firestoreGoals.length === 0 && !isLoading) { // Check isLoading to avoid premature toast
        toast({
          title: "No Savings Goals",
          description: "You haven't set any savings goals yet. Click 'Add New Goal' to start!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Failed to fetch goals in component:", error);
      toast({
        title: "Error Loading Goals",
        description: "Could not fetch your savings goals. Please check server logs for specific Firebase errors (e.g., permissions or missing indexes).",
        variant: "destructive",
      });
      setGoals([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, isLoading]); // Added isLoading to dependency array

  useEffect(() => {
    if (currentUser) {
      fetchGoals(currentUser.uid);
    } else {
      setGoals([]);
      setIsLoading(false);
    }
  }, [currentUser, fetchGoals]);
  
  const handleAddGoal = () => {
    toast({
        title: "Feature Coming Soon!",
        description: "The ability to add new goals is under development.",
    });
    // Example: Manually add a goal to Firestore for testing (remove in production)
    // if (currentUser) {
    //   addGoal({
    //     userId: currentUser.uid,
    //     name: 'New Travel Fund',
    //     targetAmount: 25000,
    //     savedAmount: 1500,
    //     iconName: 'Plane',
    //     // createdAt will be set by serverTimestamp in addGoal service
    //   } as Omit<FirestoreGoal, 'id' | 'createdAt'>) // Type assertion needed here
    //   .then(() => {
    //       toast({ title: "Sample Goal Added", description: "Refreshing list..."});
    //       fetchGoals(currentUser.uid);
    //   })
    //   .catch(err => {
    //       toast({ title: "Error Adding Sample Goal", description: err.message, variant: "destructive"});
    //   });
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
        {isLoading && !goals.length ? ( // Show loader only if truly loading and no goals yet
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
                <GoalProgressItemCard key={goal.id} goal={goal} />
                ))
            ) : (
                !isLoading && <p className="text-center text-muted-foreground py-4">No goals set yet. Click below to add one!</p>
            )}
            <div onClick={handleAddGoal} className="cursor-pointer">
                <AddGoalCard />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
