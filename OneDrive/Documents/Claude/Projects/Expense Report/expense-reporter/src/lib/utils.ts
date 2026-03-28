import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getConfidenceLabel(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 0.9) return { label: "High", color: "text-green-600 bg-green-50" };
  if (confidence >= 0.7) return { label: "Medium", color: "text-yellow-600 bg-yellow-50" };
  return { label: "Low", color: "text-red-600 bg-red-50" };
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: "🍽️",
    transport: "🚗",
    lodging: "🏨",
    travel: "✈️",
    office: "💼",
    entertainment: "🎭",
    mileage: "🚘",
    other: "📋",
  };
  return icons[category] || "📋";
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    food: "Food & Dining",
    transport: "Transportation",
    lodging: "Lodging",
    travel: "Travel",
    office: "Office Supplies",
    entertainment: "Entertainment",
    mileage: "Mileage",
    other: "Other",
  };
  return labels[category] || category;
}

export const CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "transport", label: "Transportation" },
  { value: "lodging", label: "Lodging" },
  { value: "travel", label: "Travel" },
  { value: "office", label: "Office Supplies" },
  { value: "entertainment", label: "Entertainment" },
  { value: "mileage", label: "Mileage" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS = [
  { value: "corporate_card", label: "Corporate Card" },
  { value: "credit_card", label: "Personal Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "cash", label: "Cash" },
  { value: "personal", label: "Personal (Reimbursable)" },
];

export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "JPY", label: "JPY (¥)" },
];
