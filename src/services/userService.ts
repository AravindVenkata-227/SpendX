
'use server';
import { db } from '@/lib/firebase';
import type { UserProfile, UserProfileUpdateData } from '@/types';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';

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
      photoURL: null, // Initialize photoURL
    });
    console.log("User profile created/updated for ID: ", userId);
  } catch (e: any) {
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
      const data = docSnap.data();
      return {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        createdAt: data.createdAt as Timestamp,
        photoURL: data.photoURL || null,
      } as UserProfile;
    } else {
      console.log(`No profile found for user ${userId}`);
      return null;
    }
  } catch (e: any) {
    console.error(`Error fetching profile for user ${userId}: `, e);
    return null;
  }
}

/**
 * Updates a user profile in Firestore.
 * @param userId - The Firebase Authentication UID of the user.
 * @param data - An object containing the fields to update (e.g., { fullName: "New Name" }).
 */
export async function updateUserProfile(userId: string, data: UserProfileUpdateData): Promise<void> {
  if (!userId) {
    console.error("Error updating user profile: userId is missing.");
    throw new Error("User ID is required to update a profile.");
  }
  if (Object.keys(data).length === 0) {
    console.warn("updateUserProfile called with empty data object.");
    return; // No changes to make
  }
  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, data);
    console.log("User profile updated for ID: ", userId);
  } catch (e: any) {
    console.error("Error updating user profile: ", e);
    // Provide more specific error feedback if possible
    if (e.code === 'permission-denied') {
        throw new Error("Permission denied. You may not have the rights to update this profile, or some fields are restricted.");
    }
    throw new Error("Could not update user profile. Please check server logs.");
  }
}

// Placeholder for photo URL update, to be implemented with Firebase Storage
export async function updateUserProfilePhotoURL(userId: string, photoURL: string): Promise<void> {
  if (!userId || !photoURL) {
    throw new Error("User ID and Photo URL are required.");
  }
  const userProfileRef = doc(db, 'users', userId);
  try {
    await updateDoc(userProfileRef, { photoURL });
    console.log("User profile photoURL updated for ID: ", userId);
  } catch (e: any) {
    console.error("Error updating user profile photoURL: ", e);
    throw new Error("Could not update profile photo URL.");
  }
}
