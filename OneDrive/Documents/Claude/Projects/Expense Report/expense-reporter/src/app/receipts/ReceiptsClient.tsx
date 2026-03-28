"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReceiptUploader } from "@/components/receipts/ReceiptUploader";
import { ExpenseForm } from "@/components/receipts/ExpenseForm";
import { formatCurrency, formatDate, getCategoryIcon, getCategoryLabel } from "@/lib/utils";
import { deleteExpense } from "@/lib/actions";

interface ReceiptsClientProps {
  expenses: any[];
}

export function ReceiptsClient({ expenses }: ReceiptsClientProps) {
  const router = useRouter();
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "unattached" | "attached">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    if (filter === "unattached") return !e.reportId;
    if (filter === "attached") return !!e.reportId;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this expense?")) return;
    setDeleting(id);
    await deleteExpense(id);
    router.refresh();
    setDeleting(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-500 mt-1">
            {expenses.length} total expenses
          </p>
        </div>
        <Button onClick={() => setShowManualForm(true)}>
          + Add Expense
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
        </CardHeader>
        <ReceiptUploader
          onUploadComplete={() => router.refresh()}
        />
      </Card>

      {/* Manual expense form */}
      {showManualForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Manual Expense</CardTitle>
          </CardHeader>
          <ExpenseForm
            onSave={() => {
              setShowManualForm(false);
              router.refresh();
            }}
            onCancel={() => setShowManualForm(false)}
          />
        </Card>
      )}

      {/* Edit form */}
      {editingExpense && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Expense</CardTitle>
          </CardHeader>
          <ExpenseForm
            expense={editingExpense}
            onSave={() => {
              setEditingExpense(null);
              router.refresh();
            }}
            onCancel={() => setEditingExpense(null)}
          />
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(["all", "unattached", "attached"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f === "all" ? "All" : f === "unattached" ? "Unattached" : "In Reports"}
          </button>
        ))}
      </div>

      {/* Expense list */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="🧾"
              title="No expenses found"
              description="Upload a receipt or add an expense manually."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-xl flex-shrink-0">
                  {getCategoryIcon(expense.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {expense.merchant || "Unknown merchant"}
                    </p>
                    {expense.reportId && (
                      <Badge variant="info">In report</Badge>
                    )}
                    {expense.status === "submitted" && (
                      <Badge variant="success">Submitted</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {formatDate(expense.transactionDate)} · {getCategoryLabel(expense.category)} · {expense.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                  {expense.taxAmount > 0 && (
                    <p className="text-xs text-slate-400">
                      +{formatCurrency(expense.taxAmount)} tax
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {expense.status !== "submitted" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingExpense(expense)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        loading={deleting === expense.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
