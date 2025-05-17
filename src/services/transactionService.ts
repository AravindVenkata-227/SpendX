'use server';
import { db } from '@/lib/firebase';
import type { TransactionFirestore } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

/**
 * Adds a new transaction to Firestore.
 * @param transactionData - The data for the transaction to add.
 *                          The `date` should be a string in 'YYYY-MM-DD' format.
 *                          `iconName` should be the string name of a Lucide icon.
 * @returns The ID of the newly added transaction.
 */
export async function addTransaction(transactionData: Omit<TransactionFirestore, 'id'>): Promise<string> {
  try {
    // Ensure date is a string; if it's a Date object, convert it.
    // For Firestore, it's often better to store dates as Timestamps or ISO strings.
    // Here, we assume YYYY-MM-DD string as per existing mock data.
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      // If you prefer to store dates as Firestore Timestamps:
      // date: Timestamp.fromDate(new Date(transactionData.date)), 
    });
    console.log("Transaction added with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding transaction: ", e);
    throw new Error("Could not add transaction.");
  }
}

/**
 * Fetches transactions for a specific account ID from Firestore, ordered by date descending.
 * @param accountId - The ID of the account to fetch transactions for.
 * @returns A promise that resolves to an array of transactions.
 */
export async function getTransactionsByAccountId(accountId: string): Promise<TransactionFirestore[]> {
  if (!accountId) {
    console.warn("getTransactionsByAccountId called with no accountId");
    return [];
  }
  try {
    const transactionsCol = collection(db, 'transactions');
    const q = query(
      transactionsCol, 
      where('accountId', '==', accountId),
      orderBy('date', 'desc') // Assumes date is stored in a sortable format (e.g., YYYY-MM-DD or ISO string)
    );
    const querySnapshot = await getDocs(q);
    const transactions: TransactionFirestore[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        accountId: data.accountId,
        date: data.date, // If stored as Timestamp: data.date.toDate().toISOString().split('T')[0] for YYYY-MM-DD
        description: data.description,
        category: data.category,
        amount: data.amount,
        type: data.type,
        iconName: data.iconName,
      } as TransactionFirestore);
    });
    return transactions;
  } catch (e) {
    console.error(`Error fetching transactions for account ${accountId}: `, e);
    throw new Error("Could not fetch transactions.");
  }
}
