"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { ReceiptUploader } from "@/components/receipts/ReceiptUploader";
import { ExpenseForm } from "@/components/receipts/ExpenseForm";
import { MileageForm } from "@/components/receipts/MileageForm";
import {
  formatCurrency,
  formatDate,
  getCategoryIcon,
  getCategoryLabel,
} from "@/lib/utils";
import {
  updateReport,
  addExpenseToReport,
  removeExpenseFromReport,
  submitReport,
} from "@/lib/actions";

interface ReportDetailClientProps {
  report: any;
  unattachedExpenses: any[];
  user: any;
}

export function ReportDetailClient({
  report,
  unattachedExpenses,
  user,
}: ReportDetailClientProps) {
  const router = useRouter();
  const isSubmitted = report.status === "submitted";
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showAddManual, setShowAddManual] = useState(false);
  const [showMileage, setShowMileage] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [addingExpense, setAddingExpense] = useState<string | null>(null);
  const [removingExpense, setRemovingExpense] = useState<string | null>(null);

  // Report metadata form
  const [meta, setMeta] = useState({
    title: report.title,
    department: report.department || user.department,
    dateRangeStart: report.dateRangeStart,
    dateRangeEnd: report.dateRangeEnd,
    businessPurpose: report.businessPurpose,
    projectClient: report.projectClient,
    notes: report.notes,
  });

  const handleMetaSave = async () => {
    setSavingMeta(true);
    await updateReport(report.id, meta);
    setEditingMeta(false);
    setSavingMeta(false);
    router.refresh();
  };

  const handleAddExpense = async (expenseId: string) => {
    setAddingExpense(expenseId);
    await addExpenseToReport(expenseId, report.id);
    setAddingExpense(null);
    router.refresh();
  };

  const handleRemoveExpense = async (expenseId: string) => {
    setRemovingExpense(expenseId);
    await removeExpenseFromReport(expenseId);
    setRemovingExpense(null);
    router.refresh();
  };

  const handleSubmit = async () => {
    if (
      !confirm(
        `Submit this report for ${formatCurrency(report.totalAmount)}? An email will be sent to the admin for review.`
      )
    )
      return;

    setSubmitting(true);
    setSubmitError("");

    const result = await submitReport(report.id);

    if (result.success) {
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.error || "Submission failed");
    }
    setSubmitting(false);
  };

  const handleUploadComplete = () => {
    router.refresh();
  };

  // Success state
  if (submitSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Report Submitted!
        </h1>
        <p className="text-slate-500 mb-2">
          Your expense report &ldquo;{report.title}&rdquo; for{" "}
          <strong>{formatCurrency(report.totalAmount)}</strong> has been sent
          to your administrator for review.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          You&apos;ll receive a response at {user.email}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
          <Link href="/reports">
            <Button>View All Reports</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/reports"
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Reports
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {report.title || "Untitled Report"}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                report.status === "submitted"
                  ? "info"
                  : report.status === "approved"
                  ? "success"
                  : "default"
              }
            >
              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </Badge>
            <span className="text-sm text-slate-500">
              {report.expenses.length} expense(s)
            </span>
          </div>
        </div>
        {!isSubmitted && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setEditingMeta(!editingMeta)}
            >
              Edit Details
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={report.expenses.length === 0}
            >
              Submit Report
            </Button>
          </div>
        )}
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          {!isSubmitted && !editingMeta && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingMeta(true)}
            >
              Edit
            </Button>
          )}
        </CardHeader>
        {editingMeta && !isSubmitted ? (
          <div className="space-y-4">
            <Input
              label="Report Title"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                value={meta.department}
                onChange={(e) =>
                  setMeta({ ...meta, department: e.target.value })
                }
              />
              <Input
                label="Project / Client"
                value={meta.projectClient}
                onChange={(e) =>
                  setMeta({ ...meta, projectClient: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={meta.dateRangeStart}
                onChange={(e) =>
                  setMeta({ ...meta, dateRangeStart: e.target.value })
                }
              />
              <Input
                label="End Date"
                type="date"
                value={meta.dateRangeEnd}
                onChange={(e) =>
                  setMeta({ ...meta, dateRangeEnd: e.target.value })
                }
              />
            </div>
            <Input
              label="Business Purpose"
              value={meta.businessPurpose}
              onChange={(e) =>
                setMeta({ ...meta, businessPurpose: e.target.value })
              }
              placeholder="e.g. Client kickoff meeting"
            />
            <Textarea
              label="Notes"
              value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes..."
            />
            <div className="flex gap-3">
              <Button onClick={handleMetaSave} loading={savingMeta}>
                Save Details
              </Button>
              <Button variant="ghost" onClick={() => setEditingMeta(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
            <div>
              <span className="text-slate-500">Department:</span>{" "}
              <span className="text-slate-900 font-medium">
                {report.department || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Project/Client:</span>{" "}
              <span className="text-slate-900 font-medium">
                {report.projectClient || "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Date Range:</span>{" "}
              <span className="text-slate-900 font-medium">
                {report.dateRangeStart && report.dateRangeEnd
                  ? `${formatDate(report.dateRangeStart)} — ${formatDate(report.dateRangeEnd)}`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Business Purpose:</span>{" "}
              <span className="text-slate-900 font-medium">
                {report.businessPurpose || "—"}
              </span>
            </div>
            {report.notes && (
              <div className="col-span-2">
                <span className="text-slate-500">Notes:</span>{" "}
                <span className="text-slate-900">{report.notes}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Expenses in this report */}
      <Card padding={false}>
        <div className="p-6 pb-3">
          <CardHeader>
            <CardTitle>
              Expenses ({report.expenses.length})
            </CardTitle>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(report.totalAmount)}
              </p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardHeader>
        </div>

        {report.expenses.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon="📋"
              title="No expenses yet"
              description="Upload a receipt, add a manual expense, or attach existing expenses to this report."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.expenses.map((expense: any, i: number) => (
              <div
                key={expense.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-400 w-6">
                  {i + 1}
                </span>
                <span className="text-xl flex-shrink-0">
                  {getCategoryIcon(expense.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {expense.merchant || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(expense.transactionDate)} ·{" "}
                    {getCategoryLabel(expense.category)}
                    {expense.description && ` · ${expense.description}`}
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
                {!isSubmitted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExpense(expense.id)}
                    loading={removingExpense === expense.id}
                    className="text-slate-400 hover:text-red-600 flex-shrink-0"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            {/* Total row */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50">
              <span className="w-6" />
              <span className="text-xl flex-shrink-0">💰</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Total</p>
              </div>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(report.totalAmount)}
              </p>
              {!isSubmitted && <span className="w-[52px]" />}
            </div>
          </div>
        )}
      </Card>

      {/* Add Expenses Section (only for drafts) */}
      {!isSubmitted && (
        <>
          {/* Upload receipt directly to this report */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Receipt</CardTitle>
            </CardHeader>
            <ReceiptUploader
              compact
              onUploadComplete={handleUploadComplete}
            />
          </Card>

          {/* Add manual expense */}
          {showAddManual ? (
            <Card>
              <CardHeader>
                <CardTitle>Add Manual Expense</CardTitle>
              </CardHeader>
              <ExpenseForm
                reportId={report.id}
                onSave={() => {
                  setShowAddManual(false);
                  router.refresh();
                }}
                onCancel={() => setShowAddManual(false)}
              />
            </Card>
          ) : showMileage ? (
            <Card>
              <CardHeader>
                <CardTitle>Log Mileage</CardTitle>
              </CardHeader>
              <MileageForm
                reportId={report.id}
                onSave={() => {
                  setShowMileage(false);
                  router.refresh();
                }}
                onCancel={() => setShowMileage(false)}
              />
            </Card>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowAddManual(true)}
                className="flex-1"
              >
                + Add Manual Expense
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowMileage(true)}
                className="flex-1"
              >
                Log Mileage
              </Button>
            </div>
          )}

          {/* Attach existing unattached expenses */}
          {unattachedExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Attach Existing Expenses ({unattachedExpenses.length})
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-slate-500 mb-3">
                These expenses aren&apos;t in any report yet. Click to add them.
              </p>
              <div className="space-y-2">
                {unattachedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <span className="text-lg">
                      {getCategoryIcon(expense.category)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {expense.merchant || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(expense.transactionDate)} ·{" "}
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddExpense(expense.id)}
                      loading={addingExpense === expense.id}
                    >
                      + Add
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
