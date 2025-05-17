
import { db } from '@/lib/firebase';
import type { Goal, GoalUpdateData } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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
  } catch (e: any) {
    console.error("Error adding goal: ", e);
    throw new Error(e.message || "Could not add goal.");
  }
}

/**
 * Fetches goals for a specific user ID from Firestore, ordered by creation date.
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
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      goals.push({
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        iconName: data.iconName,
        createdAt: data.createdAt as Timestamp,
      } as Goal);
    });
    return goals;
  } catch (e: any) {
    console.error(`Error fetching goals for user ${userId}: `, e);
    let detailedMessage = "Could not fetch goals. Check server logs for details (e.g., Firestore permissions or missing indexes).";
    if (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission denied'))) {
        detailedMessage = "Permission denied fetching goals. Ensure Firestore rules are deployed and allow access.";
    } else if (e.code === 'failed-precondition' || (e.message && (e.message.toLowerCase().includes('index') || e.message.toLowerCase().includes('missing or insufficient permissions')))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching goals. Check Firestore logs for details and a link to create it.";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    throw new Error(detailedMessage);
  }
}

/**
 * Updates an existing goal in Firestore.
 * @param goalId - The ID of the goal to update.
 * @param userId - The ID of the user making the update (for rule verification).
 * @param updateData - An object containing the fields to update.
 */
export async function updateGoal(goalId: string, userId: string, updateData: GoalUpdateData): Promise<void> {
  if (!userId) {
    console.error("Error updating goal: userId is missing.");
    throw new Error("User ID is required to update a goal.");
  }
  if (!goalId) {
    console.error("Error updating goal: goalId is missing.");
    throw new Error("Goal ID is required to update a goal.");
  }
  const goalRef = doc(db, 'goals', goalId);
  try {
    // Firestore rules should handle ownership verification (userId must match doc's userId)
    await updateDoc(goalRef, updateData);
    console.log("Goal updated with ID: ", goalId);
  } catch (e: any) {
    console.error("Error updating goal: ", e);
    throw new Error(e.message || "Could not update goal.");
  }
}

/**
 * Deletes a goal from Firestore.
 * @param goalId - The ID of the goal to delete.
 * @param userId - The ID of the user making the deletion (for rule verification).
 */
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  if (!userId) {
    console.error("Error deleting goal: userId is missing.");
    throw new Error("User ID is required to delete a goal.");
  }
  if (!goalId) {
    console.error("Error deleting goal: goalId is missing.");
    throw new Error("Goal ID is required to delete a goal.");
  }
  const goalRef = doc(db, 'goals', goalId);
  try {
    // Firestore rules should handle ownership verification
    await deleteDoc(goalRef);
    console.log("Goal deleted with ID: ", goalId);
  } catch (e: any) {
    console.error("Error deleting goal: ", e);
    throw new Error(e.message || "Could not delete goal.");
  }
}
