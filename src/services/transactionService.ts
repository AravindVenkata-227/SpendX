
'use server';
import { db } from '@/lib/firebase';
import type { TransactionFirestore } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

/**
 * Adds a new transaction to Firestore.
 * @param transactionData - The data for the transaction to add.
 *                          Must include `userId`.
 *                          The `date` should be a string in 'YYYY-MM-DD' format.
 *                          `iconName` should be the string name of a Lucide icon.
 * @returns The ID of the newly added transaction.
 */
export async function addTransaction(transactionData: Omit<TransactionFirestore, 'id'>): Promise<string> {
  if (!transactionData.userId) {
    console.error("Error adding transaction: userId is missing.");
    throw new Error("User ID is required to add a transaction.");
  }
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      // date: Timestamp.fromDate(new Date(transactionData.date)), // Option to store as Timestamp
    });
    console.log("Transaction added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding transaction: ", e);
    throw new Error("Could not add transaction.");
  }
}

/**
 * Fetches transactions for a specific account ID and user ID from Firestore, ordered by date descending.
 * @param accountId - The ID of the account to fetch transactions for.
 * @param userId - The ID of the authenticated user.
 * @returns A promise that resolves to an array of transactions.
 */
export async function getTransactionsByAccountId(accountId: string, userId: string): Promise<TransactionFirestore[]> {
  if (!accountId) {
    console.warn("getTransactionsByAccountId called with no accountId");
    return [];
  }
  if (!userId) {
    console.warn("getTransactionsByAccountId called with no userId");
    return [];
  }
  try {
    const transactionsCol = collection(db, 'transactions');
    const q = query(
      transactionsCol,
      where('accountId', '==', accountId),
      where('userId', '==', userId), // Ensure user can only fetch their own transactions
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const transactions: TransactionFirestore[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        accountId: data.accountId,
        date: data.date,
        description: data.description,
        category: data.category,
        amount: data.amount,
        type: data.type,
        iconName: data.iconName,
      } as TransactionFirestore);
    });
    return transactions;
  } catch (e: any) {
    let detailedMessage = "Could not fetch transactions. Check server logs for details (e.g., Firestore permissions or missing indexes).";
    if (e && e.code === 'permission-denied') {
      detailedMessage = "Permission denied fetching transactions. Please check Firestore rules and ensure you are authenticated with appropriate rights.";
    } else if (e && e.message && typeof e.message === 'string' && e.message.toLowerCase().includes("index")) {
      detailedMessage = "Failed to fetch transactions, possibly due to a missing Firestore index. Please check server logs for a link to create the required index.";
    }
    console.error(`Error fetching transactions for account ${accountId}, user ${userId}: `, e);
    // Check console for Firebase permission errors or missing index errors
    // Firestore usually provides a link to create missing indexes if that's the issue.
    throw new Error(detailedMessage);
  }
}

