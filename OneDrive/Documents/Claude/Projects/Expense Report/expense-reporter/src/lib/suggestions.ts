/**
 * Trend-Based Suggestions Engine
 *
 * Analyzes a user's historical expenses to suggest:
 * - Frequently used merchants
 * - Common categories
 * - Recurring expense patterns
 * - Quick-add prefilled expenses
 */

import { prisma } from "./db";

export interface ExpenseSuggestion {
  type: "merchant" | "category" | "recurring";
  merchant: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  frequency: number; // How many times this pattern appeared
  lastUsed: string;
  confidence: number;
}

export async function getSuggestionsForUser(
  userId: string,
  limit = 6
): Promise<ExpenseSuggestion[]> {
  // Get all past expenses for this user
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      status: { in: ["submitted", "approved", "reviewed"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Look at the last 100 expenses
  });

  if (expenses.length === 0) return [];

  const suggestions: ExpenseSuggestion[] = [];

  // 1. Frequent merchants
  const merchantCounts = new Map<
    string,
    { count: number; lastExpense: (typeof expenses)[0] }
  >();
  for (const exp of expenses) {
    if (!exp.merchant) continue;
    const existing = merchantCounts.get(exp.merchant);
    if (existing) {
      existing.count++;
    } else {
      merchantCounts.set(exp.merchant, { count: 1, lastExpense: exp });
    }
  }

  // Sort by frequency and take top merchants
  const topMerchants = Array.from(merchantCounts.entries())
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  for (const [merchant, data] of topMerchants) {
    const exp = data.lastExpense;
    suggestions.push({
      type: "merchant",
      merchant,
      category: exp.category,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      paymentMethod: exp.paymentMethod,
      frequency: data.count,
      lastUsed: exp.transactionDate,
      confidence: Math.min(0.5 + data.count * 0.1, 0.95),
    });
  }

  // 2. Recent recurring patterns (same merchant + similar amount)
  const recentExpenses = expenses.slice(0, 20);
  const seen = new Set<string>();

  for (const exp of recentExpenses) {
    if (!exp.merchant) continue;
    const key = `${exp.merchant}-${exp.category}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Check if this already exists in merchant suggestions
    if (topMerchants.some(([m]) => m === exp.merchant)) continue;

    // Only suggest if it appeared at least once before
    const pastOccurrences = expenses.filter(
      (e) =>
        e.merchant === exp.merchant &&
        e.id !== exp.id
    );

    if (pastOccurrences.length > 0) {
      suggestions.push({
        type: "recurring",
        merchant: exp.merchant,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        currency: exp.currency,
        paymentMethod: exp.paymentMethod,
        frequency: pastOccurrences.length + 1,
        lastUsed: exp.transactionDate,
        confidence: 0.6,
      });
    }
  }

  // 3. Category-based suggestions for less frequent categories
  const categoryCounts = new Map<
    string,
    { count: number; lastExpense: (typeof expenses)[0] }
  >();
  for (const exp of expenses) {
    if (!exp.category) continue;
    const existing = categoryCounts.get(exp.category);
    if (existing) {
      existing.count++;
    } else {
      categoryCounts.set(exp.category, { count: 1, lastExpense: exp });
    }
  }

  const topCategories = Array.from(categoryCounts.entries())
    .filter(([, v]) => v.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  for (const [category, data] of topCategories) {
    // Don't duplicate suggestions already covered by merchants
    if (
      suggestions.some(
        (s) => s.category === category && s.type === "merchant"
      )
    )
      continue;

    const exp = data.lastExpense;
    suggestions.push({
      type: "category",
      merchant: "",
      category,
      description: `${category.charAt(0).toUpperCase() + category.slice(1)} expense`,
      amount: 0,
      currency: exp.currency,
      paymentMethod: exp.paymentMethod,
      frequency: data.count,
      lastUsed: exp.transactionDate,
      confidence: 0.4,
    });
  }

  return suggestions.slice(0, limit);
}

/**
 * Check for possible duplicate expenses.
 * Returns matching expenses if found.
 */
export async function checkDuplicates(
  userId: string,
  merchant: string,
  amount: number,
  transactionDate: string
): Promise<{ isDuplicate: boolean; matches: any[] }> {
  if (!merchant || !amount) return { isDuplicate: false, matches: [] };

  const matches = await prisma.expense.findMany({
    where: {
      userId,
      merchant: { contains: merchant },
      amount: {
        gte: amount - 0.01,
        lte: amount + 0.01,
      },
      transactionDate,
    },
    take: 5,
  });

  return {
    isDuplicate: matches.length > 0,
    matches,
  };
}
