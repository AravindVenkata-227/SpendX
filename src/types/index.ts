
import type { LucideIcon } from 'lucide-react';

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
  // icon: LucideIcon; // This will be derived on the client
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
