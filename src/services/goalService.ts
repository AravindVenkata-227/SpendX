
import { db } from '@/lib/firebase';
import type { Goal } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Adds a new goal to Firestore for the authenticated user.
 * @param goalData - The data for the goal to add. Must include `userId`.
 * @returns The ID of the newly added goal.
 */
export async function addGoal(goalData: Omit<Goal, 'id' | 'createdAt'>): Promise<string> {
  if (!goalData.userId) {
    console.error("Error adding goal: userId is missing.");
    throw new Error("User ID is required to add a goal.");
  }
  try {
    const docRef = await addDoc(collection(db, 'goals'), {
      ...goalData,
      createdAt: serverTimestamp(), // Track when goal was created
    });
    console.log("Goal added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding goal: ", e);
    throw new Error("Could not add goal.");
  }
}

/**
 * Fetches goals for a specific user ID from Firestore, ordered by creation date (if available).
 * @param userId - The ID of the authenticated user.
 * @returns A promise that resolves to an array of goals.
 */
export async function getGoalsByUserId(userId: string): Promise<Goal[]> {
  if (!userId) {
    console.warn("getGoalsByUserId called with no userId");
    return [];
  }
  try {
    const goalsCol = collection(db, 'goals');
    const q = query(
      goalsCol,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc') 
    );
    const querySnapshot = await getDocs(q);
    const goals: Goal[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      goals.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        iconName: data.iconName,
        createdAt: data.createdAt as Timestamp, // Cast to Timestamp
      } as Goal);
    });
    return goals;
  } catch (e: any) {
    console.error(`Error fetching goals for user ${userId}: `, e);
    throw e;
  }
}

// Future functions:
// export async function updateGoal(goalId: string, updateData: Partial<Goal>): Promise<void> { ... }
// export async function deleteGoal(goalId: string): Promise<void> { ... }
