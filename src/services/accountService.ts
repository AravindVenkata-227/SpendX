
import { db } from '@/lib/firebase';
import type { Account, AccountType, AccountUpdateData } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

/**
 * Adds a new account to Firestore for the authenticated user.
 * @param accountData - The data for the account to add. Must include `userId`, `name`, `type`, `iconName`, and `accountNumberLast4`.
 * @returns The ID of the newly added account.
 */
export async function addAccount(accountData: Omit<Account, 'id' | 'createdAt'>): Promise<string> {
  if (!accountData.userId) {
    console.error("Error adding account: userId is missing.");
    throw new Error("User ID is required to add an account.");
  }
  if (!accountData.name || !accountData.type || !accountData.iconName || !accountData.accountNumberLast4) {
     console.error("Error adding account: name, type, iconName, or accountNumberLast4 is missing.");
    throw new Error("Account name, type, icon name, and last 4 digits of account number are required.");
  }

  const dataToSave: any = {
    ...accountData,
    accountNumberLast4: accountData.accountNumberLast4,
    createdAt: serverTimestamp(),
  };

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
        accountNumberLast4: data.accountNumberLast4,
        createdAt: data.createdAt as Timestamp,
      } as Account);
    });
    return accounts;
  } catch (e: any) {
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
  if (updateData.accountNumberLast4 !== undefined) {
    dataToUpdate.accountNumberLast4 = updateData.accountNumberLast4;
  }


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
 * Deletes an account and all its associated transactions from Firestore.
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

  const batch = writeBatch(db);

  try {
    // 1. Find and prepare to delete associated transactions
    const transactionsCol = collection(db, 'transactions');
    // Note: Firestore rules must allow the user to query and delete these transactions.
    // The query ensures we only target transactions belonging to this user and account.
    const q = query(transactionsCol, where('accountId', '==', accountId), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((transactionDoc) => {
      const transactionRef = doc(db, 'transactions', transactionDoc.id);
      batch.delete(transactionRef);
    });
    console.log(`Prepared ${querySnapshot.size} transactions for deletion associated with account ${accountId}.`);

    // 2. Prepare to delete the account
    const accountRef = doc(db, 'accounts', accountId);
    batch.delete(accountRef);

    // 3. Commit the batch
    await batch.commit();
    console.log("Account and its associated transactions deleted successfully for ID: ", accountId);

  } catch (e: any) {
    console.error("Error deleting account and its transactions: ", e);
    // Provide more specific feedback if possible
    if (e.code === 'permission-denied') {
        throw new Error("Permission denied. You may not have the rights to delete this account or its transactions, or some fields are restricted by Firestore rules.");
    }
    throw new Error(e.message || "Could not delete account or its transactions.");
  }
}
