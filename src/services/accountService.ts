
import { db } from '@/lib/firebase';
import type { Account } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Adds a new account to Firestore for the authenticated user.
 * @param accountData - The data for the account to add. Must include `userId`.
 * @returns The ID of the newly added account.
 */
export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<string> {
  if (!accountData.userId) {
    console.error("Error adding account: userId is missing.");
    throw new Error("User ID is required to add an account.");
  }
  try {
    // For now, this function is a placeholder. In a full implementation,
    // you'd take more details (name, type) from user input.
    const docRef = await addDoc(collection(db, 'accounts'), {
      ...accountData,
      createdAt: serverTimestamp(),
    });
    console.log("Account added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding account: ", e);
    throw new Error("Could not add account.");
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
        type: data.type,
        iconName: data.iconName,
        createdAt: data.createdAt as Timestamp,
      } as Account);
    });
    return accounts;
  } catch (e: any) {
    console.error(`Error fetching accounts for user ${userId}: `, e);
    let detailedMessage = "Could not fetch accounts. Check server logs for details.";
    if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied fetching accounts. Check Firestore rules.";
    } else if (e.message && (e.message.includes('index') || e.message.includes('Index'))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching accounts. Check Firestore logs for details and a link to create it.";
    }
    throw new Error(detailedMessage);
  }
}

// Future functions:
// export async function updateAccount(accountId: string, updateData: Partial<Account>): Promise<void> { ... }
// export async function deleteAccount(accountId: string): Promise<void> { ... }
