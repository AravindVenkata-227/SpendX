
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
    createdAt: firestoreGoal.createdAt,
  };
};


export default function GoalsSection() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<UIGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasShownNoGoalsToast, setHasShownNoGoalsToast] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setGoals([]); 
        setIsLoading(false);
        setHasShownNoGoalsToast(false); // Reset toast flag on logout
      }
    });
    return () => unsubscribe();
  }, []);

  // Reset hasShownNoGoalsToast when currentUser changes, so toast can re-evaluate for new user
  useEffect(() => {
    setHasShownNoGoalsToast(false);
  }, [currentUser]);

  const fetchGoals = useCallback(async (userId: string) => {
    setIsLoading(true);
    // setHasShownNoGoalsToast(false); // Reset here if we want toast on every re-fetch for same user
    try {
      const firestoreGoals = await getGoalsByUserId(userId);
      const uiGoals = firestoreGoals.map(mapFirestoreGoalToUIGoal);
      setGoals(uiGoals);
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
  }, [toast]); // mapFirestoreGoalToUIGoal is stable as it's outside component

  useEffect(() => {
    if (currentUser) {
      fetchGoals(currentUser.uid);
    } else {
      // Already handled by onAuthStateChanged
    }
  }, [currentUser, fetchGoals]);
  
  // useEffect for showing the "No goals" toast
  useEffect(() => {
    if (!isLoading && currentUser && goals.length === 0 && !hasShownNoGoalsToast) {
      toast({
        title: "No Savings Goals",
        description: "You haven't set any savings goals yet. Click 'Add New Goal' to start!",
        variant: "default"
      });
      setHasShownNoGoalsToast(true); // Prevent toast from showing again until user/data changes
    }
  }, [isLoading, currentUser, goals, hasShownNoGoalsToast, toast]);

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
    //   } as Omit<FirestoreGoal, 'id' | 'createdAt'>) 
    //   .then(() => {
    //       toast({ title: "Sample Goal Added", description: "Refreshing list..."});
    //       if (currentUser) fetchGoals(currentUser.uid); // Re-fetch after adding
    //       setHasShownNoGoalsToast(false); // Allow toast to re-evaluate if list becomes empty again
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
                <GoalProgressItemCard key={goal.id} goal={goal} />
                ))
            ) : (
                // Message handled by toast, or can add a static message here if preferred
                <p className="text-center text-muted-foreground py-4">No goals set yet. Click below to add one!</p>
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
