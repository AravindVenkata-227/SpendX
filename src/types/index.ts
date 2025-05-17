
import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

// Represents a transaction as stored in Firestore
export interface TransactionFirestore {
  id?: string; // Firestore will generate if not provided on add
  userId: string; // ID of the user who owns this transaction
  accountId: string;
  date: string; // Should be in YYYY-MM-DD format or ISO string for querying/sorting
  description: string;
  category: string;
  amount: number;
  type: 'debit' | 'credit';
  iconName: string; // e.g., "Utensils", "FileText" - maps to LucideIcon on client
}

// Represents a transaction for UI display (includes the actual icon component)
export interface Transaction extends Omit<TransactionFirestore, 'iconName' | 'id' | 'userId'> {
  id: string; // Ensure id is always present for UI keys
  icon: LucideIcon;
}

export interface Goal {
  id: string;
  userId: string; // ID of the user who owns this goal
  name: string;
  targetAmount: number;
  savedAmount: number;
  iconName: string; // Store icon name, map to component on client
  createdAt: Timestamp; // Track when goal was created
}

// Goal type for UI display
export interface UIGoal extends Omit<Goal, 'iconName'> {
  icon: LucideIcon;
}


export interface SpendingCategory {
  name: string;
  value: number;
  fill: string;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
    icon?: LucideIcon;
  };
}

// Represents a user profile as stored in Firestore
export interface UserProfile {
  id: string; // Corresponds to Firebase Auth UID
  fullName: string;
  email: string;
  createdAt: Timestamp;
  // Add other profile fields here if needed, e.g., notificationPreferences
}

// Represents the summary of monthly financial data
export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}
