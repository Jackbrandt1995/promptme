"use client";

import { useState, useEffect } from "react";
import { updateExpense, createManualExpense } from "@/lib/actions";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Card";
import { CATEGORIES, PAYMENT_METHODS, CURRENCIES, getConfidenceLabel, formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ExpenseData {
  id: string;
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  taxAmount: number;
  transactionDate: string;
  category: string;
  paymentMethod: string;
  reimbursable: boolean;
  billable: boolean;
  projectClient: string;
  receiptPath?: string;
  receiptFilename?: string;
  flaggedFields?: string;
  extractionConfidence?: number;
}

interface ExpenseFormProps {
  expense?: ExpenseData;
  reportId?: string;
  onSave?: () => void;
  onCancel?: () => void;
  prefill?: Partial<{
    merchant: string;
    description: string;
    amount: number;
    category: string;
    paymentMethod: string;
    currency: string;
  }>;
}

export function ExpenseForm({ expense, reportId, onSave, onCancel, prefill }: ExpenseFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const flaggedFields: string[] = expense
    ? JSON.parse(expense.flaggedFields || "[]")
    : [];

  const [form, setForm] = useState({
    merchant: expense?.merchant || prefill?.merchant || "",
    description: expense?.description || prefill?.description || "",
    amount: expense?.amount?.toString() || prefill?.amount?.toString() || "",
    currency: expense?.currency || prefill?.currency || "USD",
    taxAmount: expense?.taxAmount?.toString() || "0",
    transactionDate: expense?.transactionDate || new Date().toISOString().split("T")[0],
    category: expense?.category || prefill?.category || "",
    paymentMethod: expense?.paymentMethod || prefill?.paymentMethod || "",
    reimbursable: expense?.reimbursable ?? true,
    billable: expense?.billable ?? false,
    projectClient: expense?.projectClient || "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const data = {
        merchant: form.merchant,
        description: form.description,
        amount: parseFloat(form.amount) || 0,
        currency: form.currency,
        taxAmount: parseFloat(form.taxAmount) || 0,
        transactionDate: form.transactionDate,
        category: form.category,
        paymentMethod: form.paymentMethod,
        reimbursable: form.reimbursable,
        billable: form.billable,
        projectClient: form.projectClient,
      };

      if (!data.merchant || !data.amount || !data.transactionDate) {
        setError("Please fill in merchant, amount, and date.");
        setSaving(false);
        return;
      }

      let result;
      if (expense) {
        result = await updateExpense(expense.id, data);
      } else {
        result = await createManualExpense({ ...data, reportId });
      }

      if (result.success) {
        onSave?.();
        router.refresh();
      } else {
        setError("error" in result ? result.error : "Failed to save");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setSaving(false);
  };

  const confidence = expense?.extractionConfidence;
  const confidenceInfo = confidence ? getConfidenceLabel(confidence) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Confidence indicator */}
      {confidenceInfo && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Extraction confidence:</span>
          <Badge variant={confidence! >= 0.9 ? "success" : confidence! >= 0.7 ? "warning" : "danger"}>
            {confidenceInfo.label} ({Math.round(confidence! * 100)}%)
          </Badge>
          {flaggedFields.length > 0 && (
            <span className="text-amber-600 text-xs">
              — {flaggedFields.length} field(s) need your review
            </span>
          )}
        </div>
      )}

      {/* Receipt preview */}
      {expense?.receiptPath && (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>📎</span>
            <span>{expense.receiptFilename || "Receipt attached"}</span>
            <a
              href={expense.receiptPath}
              target="_blank"
              rel="noopener"
              className="ml-auto text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              View original
            </a>
          </div>
        </div>
      )}

      {/* Row 1: Merchant + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Merchant / Vendor"
          id="merchant"
          value={form.merchant}
          onChange={(e) => handleChange("merchant", e.target.value)}
          placeholder="e.g. Starbucks"
          flagged={flaggedFields.includes("merchant")}
          required
        />
        <Input
          label="Transaction Date"
          id="transactionDate"
          type="date"
          value={form.transactionDate}
          onChange={(e) => handleChange("transactionDate", e.target.value)}
          flagged={flaggedFields.includes("transactionDate")}
          required
        />
      </div>

      {/* Row 2: Amount + Tax + Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Amount"
          id="amount"
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          placeholder="0.00"
          flagged={flaggedFields.includes("amount")}
          required
        />
        <Input
          label="Tax Amount"
          id="taxAmount"
          type="number"
          step="0.01"
          min="0"
          value={form.taxAmount}
          onChange={(e) => handleChange("taxAmount", e.target.value)}
          placeholder="0.00"
          flagged={flaggedFields.includes("taxAmount")}
        />
        <Select
          label="Currency"
          id="currency"
          value={form.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
          options={CURRENCIES}
        />
      </div>

      {/* Row 3: Category + Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          id="category"
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          options={CATEGORIES}
          flagged={flaggedFields.includes("category")}
        />
        <Select
          label="Payment Method"
          id="paymentMethod"
          value={form.paymentMethod}
          onChange={(e) => handleChange("paymentMethod", e.target.value)}
          options={PAYMENT_METHODS}
        />
      </div>

      {/* Row 4: Description */}
      <Input
        label="Description"
        id="description"
        value={form.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Brief description of the expense"
      />

      {/* Row 5: Project + Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <Input
          label="Project / Client"
          id="projectClient"
          value={form.projectClient}
          onChange={(e) => handleChange("projectClient", e.target.value)}
          placeholder="Optional"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={form.reimbursable}
            onChange={(e) => handleChange("reimbursable", e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Reimbursable
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-2">
          <input
            type="checkbox"
            checked={form.billable}
            onChange={(e) => handleChange("billable", e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Billable
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={saving}>
          {expense ? "Save Changes" : "Add Expense"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
