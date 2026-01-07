
export interface Hen {
  id: string;
  name: string;
  breed: string;
  age: string | number;
  color: string;
  createdAt: number;
}

export interface EggLog {
  id: string;
  henId: string;
  henName: string;
  weight: number; // in grams
  quantity: number; // number of eggs
  timestamp: number;
}

export enum ExpenseCategory {
  FEED = '饲料',
  MEDS = '药品',
  EQUIPMENT = '设备',
  OTHERS = '其他'
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  timestamp: number;
}

export enum View {
  HOME = 'home',
  STATISTICS = 'statistics',
  FINANCE = 'finance',
  HENS = 'hens',
  GUIDE = 'guide'
}

// Added Recipe interface for AI generated content
export interface Recipe {
  recipeName: string;
  eggsNeeded: number;
  steps: string[];
  whyChloeLikes: string;
  secret: string;
}
