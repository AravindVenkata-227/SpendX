
import { db } from '@/lib/firebase';
import type { TransactionFirestore, MonthlySummary } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';

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
    console.error(`Error fetching transactions for account ${accountId}, user ${userId}: `, e);
    // Let original Firebase error propagate or be handled by the calling component
    throw e; 
  }
}

/**
 * Fetches all transactions for a specific user for a given month and year,
 * and calculates total income, total expenses, and net savings.
 * @param userId - The ID of the authenticated user.
 * @param year - The year for which to fetch the summary.
 * @param month - The month (1-12) for which to fetch the summary.
 * @returns A promise that resolves to a MonthlySummary object.
 */
export async function getMonthlySummary(userId: string, year: number, month: number): Promise<MonthlySummary> {
  if (!userId) {
    console.warn("getMonthlySummary called with no userId");
    return { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
  }

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);

  const startDateString = formatISO(firstDayOfMonth, { representation: 'date' }); 
  const endDateString = formatISO(lastDayOfMonth, { representation: 'date' }); 
  
  try {
    const transactionsCol = collection(db, 'transactions');
    const q = query(
      transactionsCol,
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString)
    );

    const querySnapshot = await getDocs(q);
    let totalIncome = 0;
    let totalExpenses = 0;

    querySnapshot.forEach((doc) => {
      const transaction = doc.data() as TransactionFirestore;
      if (transaction.type === 'credit') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'debit') {
        totalExpenses += transaction.amount; 
      }
    });
    
    const netSavings = totalIncome + totalExpenses; 

    return {
      totalIncome,
      totalExpenses: Math.abs(totalExpenses), 
      netSavings,
    };
  } catch (e: any) {
    console.error(`Error fetching monthly summary for user ${userId}, ${year}-${month}: `, e);
    throw e;
  }
}
