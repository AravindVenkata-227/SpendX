import type { LucideIcon } from 'lucide-react';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'debit' | 'credit';
  icon?: LucideIcon; 
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
