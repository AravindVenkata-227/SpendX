
import type { LucideIcon } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { Plane, Home, Car, Smartphone, BookOpen, ShoppingCart, ShieldCheck, Gift, Target } from 'lucide-react';

// Represents a transaction as stored in Firestore
export interface TransactionFirestore {
  id?: string; // Firestore will generate if not provided on add
  userId: string; // ID of the user who owns this transaction
  accountId: string;
  date: string; // Should be in YYYY-MM-DD format or ISO string for querying/sorting
  description: string;
  category: string;
  amount: number; // Positive for credit, negative for debit
  type: 'debit' | 'credit';
  iconName: string; // e.g., "Utensils", "FileText" - maps to LucideIcon on client
}

// Represents a transaction for UI display (includes the actual icon component)
export interface UITransactionType extends Omit<TransactionFirestore, 'iconName' | 'id' | 'userId' | 'accountId'> {
  id: string; // Ensure id is always present for UI keys
  accountId: string;
  icon: LucideIcon;
}

// Data for updating a transaction, excluding non-updatable fields like id, userId, accountId
export type TransactionUpdateData = Partial<Omit<TransactionFirestore, 'id' | 'userId' | 'accountId'>>;


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
export interface UIGoal extends Omit<Goal, 'iconName' | 'createdAt'> {
  icon: LucideIcon;
  createdAt: Timestamp; // Keep as Timestamp for potential client-side formatting
}

// Predefined Goal Icons for selection
export const GoalIcons: { name: string; icon: LucideIcon; iconName: string }[] = [
  { name: "Travel", icon: Plane, iconName: "Plane" },
  { name: "New Home", icon: Home, iconName: "Home" },
  { name: "New Car", icon: Car, iconName: "Car" },
  { name: "Gadget", icon: Smartphone, iconName: "Smartphone" },
  { name: "Education", icon: BookOpen, iconName: "BookOpen" },
  { name: "Shopping", icon: ShoppingCart, iconName: "ShoppingBag" },
  { name: "Savings/Emergency", icon: ShieldCheck, iconName: "ShieldCheck" },
  { name: "Gift", icon: Gift, iconName: "Gift" },
  { name: "Other", icon: Target, iconName: "Target" },
];

export type GoalIconName = typeof GoalIcons[number]['iconName'];


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

export interface NotificationPreferences {
  onOverspending: boolean;
  onLargeTransactions: boolean;
  onSavingsOpportunities: boolean;
  emailForAISuggestions?: boolean; // Added for AI insight emails
}

// Represents a user profile as stored in Firestore
export interface UserProfile {
  id: string; // Corresponds to Firebase Auth UID
  fullName: string;
  email: string;
  createdAt: Timestamp;
  photoURL?: string | null;
  notificationPreferences?: NotificationPreferences;
}

// Data for updating a user profile, restricted to allowed fields
export type UserProfileUpdateData = {
  fullName?: string;
  notificationPreferences?: NotificationPreferences;
  // photoURL will be handled separately if we implement direct upload
};


// Represents the summary of monthly financial data
export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
}

// Represents a financial account as stored in Firestore
export const AccountTypes = ["Savings", "Checking", "Credit Card", "Investment", "Loan", "Other"] as const;
export type AccountType = typeof AccountTypes[number];

export interface Account {
  id: string;
  userId: string;
  name: string; // e.g., "Primary Savings", "Salary Account"
  type: AccountType;
  iconName: string; // Name of the Lucide icon
  accountNumberLast4: string; 
  createdAt: Timestamp;
}

// Account type for UI display (includes actual icon component)
export interface UIAccount extends Omit<Account, 'iconName' | 'createdAt'> {
  icon: LucideIcon;
  accountNumberLast4: string;
}

// Data for updating an account, excluding non-updatable fields
export type AccountUpdateData = Partial<Omit<Account, 'id' | 'userId' | 'createdAt'>>;


// For Add Transaction Dialog
export const TransactionCategories = [
  "Food", "Groceries", "Bills", "Utilities", "Rent/Mortgage", "Transport", "Shopping",
  "Entertainment", "Health", "Education", "Income", "Investment", "Travel", "Gifts", "Other"
] as const;
export type TransactionCategory = typeof TransactionCategories[number];

// Data for updating a goal, excluding non-updatable fields
export type GoalUpdateData = Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>;
