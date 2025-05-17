
import { db } from '@/lib/firebase';
import type { TransactionFirestore, MonthlySummary } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth, formatISO, parseISO } from 'date-fns';

/**
 * Adds a new transaction to Firestore.
 * @param transactionData - The data for the transaction to add.
 *                          Must include `userId`, `accountId`.
 *                          The `date` should be a string in 'YYYY-MM-DD' format.
 *                          `iconName` should be the string name of a Lucide icon.
 *                          `amount` should be positive for credit, negative for debit.
 * @returns The ID of the newly added transaction.
 */
export async function addTransaction(transactionData: Omit<TransactionFirestore, 'id'>): Promise<string> {
  if (!transactionData.userId) {
    console.error("Error adding transaction: userId is missing.");
    throw new Error("User ID is required to add a transaction.");
  }
  if (!transactionData.accountId) {
    console.error("Error adding transaction: accountId is missing.");
    throw new Error("Account ID is required to add a transaction.");
  }
   if (typeof transactionData.amount !== 'number') {
    console.error("Error adding transaction: amount is invalid.");
    throw new Error("Transaction amount must be a number.");
  }
  try {
    // Validate date format before sending to Firestore
    parseISO(transactionData.date); // Will throw error if date is not valid ISO YYYY-MM-DD

    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
    });
    console.log("Transaction added with ID: ", docRef.id);
    return docRef.id;
  } catch (e: any) {
    console.error("Error adding transaction: ", e);
    if (e.message.includes("Invalid ISO date")) {
        throw new Error("Invalid date format. Please use YYYY-MM-DD.");
    }
    throw new Error(e.message || "Could not add transaction. Please check server logs.");
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
    // console.warn("getTransactionsByAccountId called with no accountId"); // Can be noisy
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
      where('userId', '==', userId), 
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
        date: data.date, // Stored as 'YYYY-MM-DD' string
        description: data.description,
        category: data.category,
        amount: data.amount, // Stored as number (positive for credit, negative for debit)
        type: data.type,
        iconName: data.iconName,
      } as TransactionFirestore);
    });
    return transactions;
  } catch (e: any) {
    console.error(`Error fetching transactions for account ${accountId}, user ${userId}: `, e);
    let detailedMessage = "Could not fetch transactions. Check server logs for details.";
    if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied fetching transactions. Check Firestore rules.";
    } else if (e.message && (e.message.includes('index') || e.message.includes('Index'))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching transactions.";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    // Check console for Firebase permission errors or missing index errors
    // Firestore usually provides a link to create missing indexes if that's the issue.
    throw new Error(detailedMessage);
  }
}


/**
 * Fetches all transactions for a specific user for a given month and year.
 * @param userId - The ID of the authenticated user.
 * @param year - The year for which to fetch the summary.
 * @param month - The month (1-12) for which to fetch the summary.
 * @returns A promise that resolves to an array of TransactionFirestore objects.
 */
export async function getTransactionsForMonth(userId: string, year: number, month: number): Promise<TransactionFirestore[]> {
  if (!userId) {
    console.warn("getTransactionsForMonth called with no userId");
    return [];
  }

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = endOfMonth(firstDayOfMonth);

  // Ensure dates are in YYYY-MM-DD string format for Firestore query
  const startDateString = formatISO(firstDayOfMonth, { representation: 'date' }); 
  const endDateString = formatISO(lastDayOfMonth, { representation: 'date' }); 
  
  try {
    const transactionsCol = collection(db, 'transactions');
    const q = query(
      transactionsCol,
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<=', endDateString)
      // Note: No orderBy('date') here, as it would require another index specific to this query if not covered.
      // Sorting can be done client-side if needed, or add index if server-side sort is critical.
    );

    const querySnapshot = await getDocs(q);
    const transactions: TransactionFirestore[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId, // Ensure all fields are mapped
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
    console.error(`Error fetching transactions for month for user ${userId}, ${year}-${month}: `, e);
    let detailedMessage = "Could not fetch monthly transactions. Check server logs for details.";
    if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied fetching monthly transactions. Check Firestore rules.";
    } else if (e.message && (e.message.includes('index') || e.message.includes('Index'))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching monthly transactions. Check server logs for a link to create it if needed (query: userId == X, date >= Y, date <= Z).";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    throw new Error(detailedMessage);
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
    // console.warn("getMonthlySummary called with no userId"); // Can be noisy
    return { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
  }
  
  try {
    const transactions = await getTransactionsForMonth(userId, year, month);
    let totalIncome = 0;
    let totalExpenses = 0; // Will be sum of negative numbers

    transactions.forEach((transaction) => {
      if (transaction.type === 'credit') {
        totalIncome += transaction.amount; // Assume credits are positive
      } else if (transaction.type === 'debit') {
        totalExpenses += transaction.amount; // Assume debits are negative
      }
    });
    
    // totalExpenses is negative. Net savings = income - (absolute expenses)
    // which is income + (negative_expenses)
    const netSavings = totalIncome + totalExpenses; 

    return {
      totalIncome,
      totalExpenses: Math.abs(totalExpenses), // Display expenses as a positive number
      netSavings,
    };
  } catch (e: any) {
    let detailedMessage = `Could not calculate monthly summary. Error: ${e.message}`;
     if (e.message && e.message.toLowerCase().includes('permission denied')) {
        detailedMessage = "Permission denied fetching monthly summary. Check Firestore rules.";
    } else if (e.message && (e.message.includes('index') || e.message.includes('Index'))) {
        detailedMessage = "Missing or insufficient Firestore index for monthly summary. Check server logs.";
    }
    console.error(`Error calculating monthly summary for user ${userId}, ${year}-${month}: `, e);
    throw new Error(detailedMessage);
  }
}
