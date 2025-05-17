
'use server';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Creates or updates a user profile in Firestore.
 * @param userId - The Firebase Authentication UID of the user.
 * @param fullName - The user's full name.
 * @param email - The user's email.
 */
export async function createUserProfile(userId: string, fullName: string, email: string): Promise<void> {
  if (!userId) {
    console.error("Error creating user profile: userId is missing.");
    throw new Error("User ID is required to create a profile.");
  }
  const userProfileRef = doc(db, 'users', userId);
  try {
    await setDoc(userProfileRef, {
      id: userId,
      fullName,
      email,
      createdAt: serverTimestamp(),
    });
    console.log("User profile created/updated for ID: ", userId);
  } catch (e) {
    console.error("Error creating/updating user profile: ", e);
    throw new Error("Could not create/update user profile.");
  }
}

/**
 * Fetches a user profile from Firestore.
 * @param userId - The Firebase Authentication UID of the user.
 * @returns A promise that resolves to the UserProfile object or null if not found.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.warn("getUserProfile called with no userId");
    return null;
  }
  const userProfileRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      // Explicitly cast to UserProfile, ensuring all fields match
      const data = docSnap.data();
      return {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        createdAt: data.createdAt as Timestamp, // Cast to Timestamp
      } as UserProfile;
    } else {
      console.log(`No profile found for user ${userId}`);
      return null;
    }
  } catch (e) {
    console.error(`Error fetching profile for user ${userId}: `, e);
    // Don't throw here, allow UI to handle null profile gracefully
    return null;
  }
}
