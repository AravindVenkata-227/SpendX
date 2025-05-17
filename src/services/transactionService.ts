
import { db } from '@/lib/firebase';
import type { TransactionFirestore, MonthlySummary, TransactionUpdateData } from '@/types';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    let detailedMessage = "Could not fetch transactions. Check server logs for details.";
    if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied fetching transactions. Check Firestore rules and ensure data has correct userId.";
    } else if (e.message && (e.message.toLowerCase().includes('index') || e.message.toLowerCase().includes('index'))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching transactions. Check Firestore logs for details and a link to create it.";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    throw new Error(detailedMessage);
  }
}


/**
 * Updates an existing transaction in Firestore.
 * @param transactionId - The ID of the transaction to update.
 * @param userId - The ID of the user making the update (for rule verification).
 * @param updateData - An object containing the fields to update.
 *                     `amount` should be the new absolute amount. The service will adjust sign based on `type`.
 */
export async function updateTransaction(transactionId: string, userId: string, updateData: TransactionUpdateData): Promise<void> {
  if (!userId) {
    console.error("Error updating transaction: userId is missing.");
    throw new Error("User ID is required to update a transaction.");
  }
  if (!transactionId) {
    console.error("Error updating transaction: transactionId is missing.");
    throw new Error("Transaction ID is required to update a transaction.");
  }
  const transactionRef = doc(db, 'transactions', transactionId);
  
  const dataToUpdate = { ...updateData };

  // If amount and type are part of the update, adjust the amount's sign
  if (dataToUpdate.amount !== undefined && dataToUpdate.type !== undefined) {
    dataToUpdate.amount = dataToUpdate.type === 'debit' ? -Math.abs(dataToUpdate.amount) : Math.abs(dataToUpdate.amount);
  } else if (dataToUpdate.amount !== undefined && updateData.type === undefined) {
    // If only amount is updated, we need the original type to set the sign,
    // or assume the service is called with type if amount is changing.
    // This scenario is tricky without fetching the original doc.
    // Best practice: Ensure UI sends both new amount AND new type if either changes.
    // For now, we'll assume if amount is present, type is also present or doesn't need to change sign.
    // If type is NOT in updateData, but amount IS, this could lead to wrong sign if type should have flipped.
    // This is why EditTransactionDialog should submit both if amount or type changes.
    console.warn("Updating amount without type might lead to incorrect sign if type should also change.");
  }


  try {
    // Firestore rules should handle ownership verification (userId must match doc's userId)
    await updateDoc(transactionRef, dataToUpdate);
    console.log("Transaction updated with ID: ", transactionId);
  } catch (e: any) {
    console.error("Error updating transaction: ", e);
    throw new Error(e.message || "Could not update transaction.");
  }
}

/**
 * Deletes a transaction from Firestore.
 * @param transactionId - The ID of the transaction to delete.
 * @param userId - The ID of the user making the deletion (for rule verification).
 */
export async function deleteTransaction(transactionId: string, userId: string): Promise<void> {
  if (!userId) {
    console.error("Error deleting transaction: userId is missing.");
    throw new Error("User ID is required to delete a transaction.");
  }
  if (!transactionId) {
    console.error("Error deleting transaction: transactionId is missing.");
    throw new Error("Transaction ID is required to delete a transaction.");
  }
  const transactionRef = doc(db, 'transactions', transactionId);
  try {
    // Firestore rules should handle ownership verification
    await deleteDoc(transactionRef);
    console.log("Transaction deleted with ID: ", transactionId);
  } catch (e: any) {
    console.error("Error deleting transaction: ", e);
    throw new Error(e.message || "Could not delete transaction.");
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
    console.error(`Error fetching transactions for month for user ${userId}, ${year}-${month}: `, e);
    let detailedMessage = "Could not fetch monthly transactions. Check server logs for details.";
     if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied fetching monthly transactions. Check Firestore rules and ensure data has correct userId.";
    } else if (e.message && (e.message.toLowerCase().includes('index') || e.message.toLowerCase().includes('index'))) {
        detailedMessage = "Missing or insufficient Firestore index for fetching monthly transactions. Check Firestore logs for details and a link to create it.";
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
    return { totalIncome: 0, totalExpenses: 0, netSavings: 0 };
  }
  
  try {
    const transactions = await getTransactionsForMonth(userId, year, month);
    let totalIncome = 0;
    let totalExpenses = 0; 

    transactions.forEach((transaction) => {
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
    let detailedMessage = `Could not calculate monthly summary. Error: ${e.message}`;
     if (e.code === 'permission-denied') {
        detailedMessage = "Permission denied calculating monthly summary. Check Firestore rules.";
    } else if (e.message && (e.message.toLowerCase().includes('index') || e.message.toLowerCase().includes('index'))) {
        detailedMessage = "Missing or insufficient Firestore index for monthly summary. Check server logs.";
    } else if (e.message) {
        detailedMessage = e.message;
    }
    console.error(`Error calculating monthly summary for user ${userId}, ${year}-${month}: `, e);
    throw new Error(detailedMessage);
  }
}

