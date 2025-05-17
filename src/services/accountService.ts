
import { db } from '@/lib/firebase';
import type { Account, AccountType, AccountUpdateData } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

/**
 * Adds a new account to Firestore for the authenticated user.
 * @param accountData - The data for the account to add. Must include `userId`, `name`, `type`, and `iconName`.
 * @returns The ID of the newly added account.
 */
export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<string> {
  if (!accountData.userId) {
    console.error("Error adding account: userId is missing.");
    throw new Error("User ID is required to add an account.");
  }
  if (!accountData.name || !accountData.type || !accountData.iconName) {
     console.error("Error adding account: name, type, or iconName is missing.");
    throw new Error("Account name, type, and icon name are required.");
  }

  const dataToSave: any = {
    ...accountData,
    createdAt: serverTimestamp(),
  };

  // Only include accountNumberLast4 if it's provided and not an empty string
  if (accountData.accountNumberLast4 && accountData.accountNumberLast4.trim() !== '') {
    dataToSave.accountNumberLast4 = accountData.accountNumberLast4;
  } else {
    // Ensure it's not saved if empty, or handle as null if preferred for querying
    delete dataToSave.accountNumberLast4; 
  }


  try {
    const docRef = await addDoc(collection(db, 'accounts'), dataToSave);
    console.log("Account added with ID: ", docRef.id);
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding account: ", e);
    throw new Error(e.message || "Could not add account. Please check server logs.");
  }
}

/**
 * Fetches accounts for a specific user ID from Firestore, ordered by name.
 * @param userId - The ID of the authenticated user.
 * @returns A promise that resolves to an array of accounts.
 */
export async function getAccountsByUserId(userId: string): Promise<Account[]> {
  if (!userId) {
    console.warn("getAccountsByUserId called with no userId");
    return [];
  }
  try {
    const accountsCol = collection(db, 'accounts');
    const q = query(
      accountsCol,
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const accounts: Account[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      accounts.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        type: data.type as AccountType,
        iconName: data.iconName,
        accountNumberLast4: data.accountNumberLast4 || undefined,
        createdAt: data.createdAt as Timestamp,
      } as Account); // Ensure correct casting
    });
    return accounts;
  } catch (e: any)
{
    console.error(`Error fetching accounts for user ${userId}: `, e);
    let detailedMessage = "Could not fetch your accounts. Please try again later.";
    if (e.code === 'permission-denied' || (e.message && e.message.toLowerCase().includes('permission denied'))) {
        detailedMessage = "Permission denied fetching accounts. Ensure Firestore rules are deployed and allow access, and that account documents have the correct 'userId' matching the authenticated user.";
    } else if (e.code === 'failed-precondition' || (e.message && (e.message.toLowerCase().includes('index') || e.message.toLowerCase().includes('missing or insufficient permissions')))) {
       detailedMessage = "Missing or insufficient Firestore index for fetching accounts. Check Firestore logs for details and a link to create it.";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    throw new Error(detailedMessage);
  }
}

/**
 * Updates an existing account in Firestore.
 * @param accountId - The ID of the account to update.
 * @param userId - The ID of the user making the update (for rule verification).
 * @param updateData - An object containing the fields to update.
 */
export async function updateAccount(accountId: string, userId: string, updateData: AccountUpdateData): Promise<void> {
  if (!userId) {
    console.error("Error updating account: userId is missing.");
    throw new Error("User ID is required to update an account.");
  }
  if (!accountId) {
    console.error("Error updating account: accountId is missing.");
    throw new Error("Account ID is required to update an account.");
  }
  const accountRef = doc(db, 'accounts', accountId);
  
  const dataToUpdate: any = { ...updateData };
  // If accountNumberLast4 is explicitly set to an empty string, remove it or set to a specific value
  // to signify it's not present (e.g., if Firestore handles empty strings as not present)
  if (updateData.accountNumberLast4 === '') {
    dataToUpdate.accountNumberLast4 = null; // Or use delete if you prefer not to store nulls
  } else if (updateData.accountNumberLast4) {
    dataToUpdate.accountNumberLast4 = updateData.accountNumberLast4;
  }
  // if accountNumberLast4 is undefined in updateData, it won't be touched

  try {
    // Firestore rules should handle ownership verification (userId must match doc's userId)
    await updateDoc(accountRef, dataToUpdate);
    console.log("Account updated with ID: ", accountId);
  } catch (e: any) {
    console.error("Error updating account: ", e);
    throw new Error(e.message || "Could not update account.");
  }
}

/**
 * Deletes an account from Firestore.
 * @param accountId - The ID of the account to delete.
 * @param userId - The ID of the user making the deletion (for rule verification).
 */
export async function deleteAccount(accountId: string, userId: string): Promise<void> {
  if (!userId) {
    console.error("Error deleting account: userId is missing.");
    throw new Error("User ID is required to delete an account.");
  }
  if (!accountId) {
    console.error("Error deleting account: accountId is missing.");
    throw new Error("Account ID is required to delete an account.");
  }
  const accountRef = doc(db, 'accounts', accountId);
  try {
    // Firestore rules should handle ownership verification
    await deleteDoc(accountRef);
    console.log("Account deleted with ID: ", accountId);
  } catch (e: any) {
    console.error("Error deleting account: ", e);
    throw new Error(e.message || "Could not delete account.");
  }
}
