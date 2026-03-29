export type ExpenseCategory =
  | "Travel"
  | "Meals"
  | "Software"
  | "Equipment"
  | "Office"
  | "Marketing"
  | "Training"
  | "Other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Travel", "Meals", "Software", "Equipment",
  "Office", "Marketing", "Training", "Other",
];

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];

export interface LineItemPayload {
  description: string;
  amount: number;
  order: number;
}

export interface CreateExpensePayload {
  merchant: string;
  date: string;
  totalAmount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  notes?: string;
  lineItems: LineItemPayload[];
}

export interface UpdateExpensePayload {
  merchant?: string;
  date?: string;
  totalAmount?: number;
  currency?: string;
  category?: string;
  description?: string;
  notes?: string;
}

export interface ApprovePayload {
  note?: string;
}

export interface RejectPayload {
  note: string;
}

export interface ApprovalRulePayload {
  thresholdPercent: number;
  overrideRole: string;
  steps: {
    order: number;
    role: string;
    type: "SEQUENTIAL" | "OVERRIDE";
    slaDays: number;
  }[];
}
