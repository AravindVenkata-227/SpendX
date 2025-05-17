import type { LucideIcon } from 'lucide-react';

// Represents a transaction as stored in Firestore
export interface TransactionFirestore {
  id?: string; // Firestore will generate if not provided on add
  accountId: string;
  date: string; // Should be in YYYY-MM-DD format or ISO string for querying/sorting
  description: string;
  category: string;
  amount: number;
  type: 'debit' | 'credit';
  iconName: string; // e.g., "Utensils", "FileText" - maps to LucideIcon on client
}

// Represents a transaction for UI display (includes the actual icon component)
export interface Transaction extends Omit<TransactionFirestore, 'iconName' | 'id'> {
  id: string; // Ensure id is always present for UI keys
  icon: LucideIcon;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
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
