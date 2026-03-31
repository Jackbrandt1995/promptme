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
  resubmitReport,
} from "@/lib/actions";

interface ReportDetailClientProps {
  report: any;
  unattachedExpenses: any[];
  user: any;
}

const STATUS_COLORS: Record<string, string> = {
  draft:              "bg-slate-100 text-slate-700",
  submitted:          "bg-blue-100 text-blue-700",
  revision_requested: "bg-amber-100 text-amber-700",
  approved:           "bg-green-100 text-green-700",
  rejected:           "bg-red-100 text-red-700",
  finalized:          "bg-emerald-100 text-emerald-800",
};

const LINE_ITEM_BADGE: Record<string, { label: string; cls: string }> = {
  accepted:       { label: "✓ Accepted",     cls: "text-green-700 bg-green-50 border-green-200" },
  declined:       { label: "✕ Declined",     cls: "text-red-700 bg-red-50 border-red-200" },
  needs_revision: { label: "⚠ Needs Revision", cls: "text-amber-700 bg-amber-50 border-amber-200" },
};

export function ReportDetailClient({
  report,
  unattachedExpenses,
  user,
}: ReportDetailClientProps) {
  const router = useRouter();

  const canEdit    = report.status === "draft" || report.status === "revision_requested";
  const canSubmit  = canEdit && report.expenses.length > 0;
  const isRevision = report.status === "revision_requested";

  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [savingMeta,  setSavingMeta]  = useState(false);
  const [addingExpense, setAddingExpense] = useState<string | null>(null);
  const [removingExpense, setRemovingExpense] = useState<string | null>(null);

  // Report metadata form
  const [meta, setMeta] = useState({
    title:          report.title,
    department:     report.department || user.department,
    dateRangeStart: report.dateRangeStart,
    dateRangeEnd:   report.dateRangeEnd,
    businessPurpose: report.businessPurpose,
    projectClient:  report.projectClient,
    notes:          report.notes,
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
    if (!confirm(
      `Submit this report for ${formatCurrency(report.totalAmount)}? An email will be sent to your administrator for review.`
    )) return;

    setSubmitting(true);
    setSubmitError("");

    const result = isRevision
      ? await resubmitReport(report.id)
      : await submitReport(report.id);

    if (result.success) {
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.error || "Submission failed");
    }
    setSubmitting(false);
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted!</h1>
        <p className="text-slate-500 mb-2">
          Your expense report &ldquo;{report.title}&rdquo; for{" "}
          <strong>{formatCurrency(report.totalAmount)}</strong> has been sent to
          your administrator for review.
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

  const statusLabel =
    report.status === "revision_requested" ? "Revisions Needed"
    : report.status === "finalized"        ? "Finalized"
    : report.status.charAt(0).toUpperCase() + report.status.slice(1);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {report.title || "Untitled Report"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[report.status] ?? "bg-slate-100 text-slate-700"}`}>
                {statusLabel}
              </span>
              <span className="text-sm text-slate-500">
                {report.expenses.length} expense(s)
              </span>
            </div>
          </div>
          {canEdit && !editingMeta && (
            <Button variant="ghost" size="sm" onClick={() => setEditingMeta(true)}>
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {/* ── Admin feedback banner (revision_requested) ─────────────── */}
      {isRevision && report.adminNotes && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            ⚠ Administrator Notes
          </p>
          <p className="text-sm text-amber-700">{report.adminNotes}</p>
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* ── Report Metadata ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        {editingMeta && canEdit ? (
          <div className="space-y-4 mt-3">
            <Input
              label="Report Title"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                value={meta.department}
                onChange={(e) => setMeta({ ...meta, department: e.target.value })}
              />
              <Input
                label="Project / Client"
                value={meta.projectClient}
                onChange={(e) => setMeta({ ...meta, projectClient: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={meta.dateRangeStart}
                onChange={(e) => setMeta({ ...meta, dateRangeStart: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={meta.dateRangeEnd}
                onChange={(e) => setMeta({ ...meta, dateRangeEnd: e.target.value })}
              />
            </div>
            <Input
              label="Business Purpose"
              value={meta.businessPurpose}
              onChange={(e) => setMeta({ ...meta, businessPurpose: e.target.value })}
              placeholder="e.g. Clinic visits — March"
            />
            <Textarea
              label="Notes"
              value={meta.notes}
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })}
              rows={2}
            />
            <div className="flex gap-3">
              <Button onClick={handleMetaSave} loading={savingMeta}>Save Details</Button>
              <Button variant="ghost" onClick={() => setEditingMeta(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm mt-3">
            <div><span className="text-slate-500">Department:</span>{" "}<span className="font-medium">{report.department || "—"}</span></div>
            <div><span className="text-slate-500">Project/Client:</span>{" "}<span className="font-medium">{report.projectClient || "—"}</span></div>
            <div>
              <span className="text-slate-500">Date Range:</span>{" "}
              <span className="font-medium">
                {report.dateRangeStart && report.dateRangeEnd
                  ? `${formatDate(report.dateRangeStart)} — ${formatDate(report.dateRangeEnd)}`
                  : "—"}
              </span>
            </div>
            <div><span className="text-slate-500">Business Purpose:</span>{" "}<span className="font-medium">{report.businessPurpose || "—"}</span></div>
            {report.notes && (
              <div className="col-span-2"><span className="text-slate-500">Notes:</span>{" "}{report.notes}</div>
            )}
          </div>
        )}
      </Card>

      {/* ── Expense Line Items ──────────────────────────────────────── */}
      <Card padding={false}>
        <div className="p-6 pb-3">
          <CardHeader>
            <CardTitle>Expenses ({report.expenses.length})</CardTitle>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(report.totalAmount)}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </CardHeader>
        </div>

        {report.expenses.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon="📋"
              title="No expenses yet"
              description="Use the panels below to upload receipts or log mileage."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.expenses.map((expense: any, i: number) => {
              const li = expense.lineItemStatus ? LINE_ITEM_BADGE[expense.lineItemStatus] : null;
              return (
                <div key={expense.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors ${expense.lineItemStatus === "declined" ? "opacity-60" : ""}`}>
                  <span className="text-sm font-medium text-slate-400 w-6">{i + 1}</span>
                  <span className="text-xl flex-shrink-0">{getCategoryIcon(expense.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {expense.merchant || "Unknown"}
                      </p>
                      {li && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${li.cls}`}>
                          {li.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(expense.transactionDate)} · {getCategoryLabel(expense.category)}
                      {expense.description && ` · ${expense.description}`}
                    </p>
                    {expense.adminLineItemNotes && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Admin note: {expense.adminLineItemNotes}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                    {expense.taxAmount > 0 && (
                      <p className="text-xs text-slate-400">+{formatCurrency(expense.taxAmount)} tax</p>
                    )}
                  </div>
                  {canEdit && (
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
              );
            })}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50">
              <span className="w-6" />
              <span className="text-xl flex-shrink-0">💰</span>
              <div className="flex-1"><p className="text-sm font-semibold text-slate-900">Total</p></div>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(report.totalAmount)}</p>
              {canEdit && <span className="w-[52px]" />}
            </div>
          </div>
        )}
      </Card>

      {/* ── Add Expenses — Two-column layout ────────────────────────── */}
      {canEdit && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Upload Receipt */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Receipt</CardTitle>
              </CardHeader>
              <ReceiptUploader
                reportId={report.id}
                onUploadComplete={() => router.refresh()}
              />
            </Card>

            {/* Right: Log Mileage */}
            <Card>
              <CardHeader>
                <CardTitle>Log Mileage</CardTitle>
              </CardHeader>
              <MileageForm
                reportId={report.id}
                onSave={() => router.refresh()}
              />
            </Card>
          </div>

          {/* Add manual expense (collapsed by default) */}
          <ManualExpenseSection reportId={report.id} onSave={() => router.refresh()} />

          {/* Attach existing unattached expenses */}
          {unattachedExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attach Existing Expenses ({unattachedExpenses.length})</CardTitle>
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
                    <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {expense.merchant || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(expense.transactionDate)} · {formatCurrency(expense.amount)}
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

          {/* ── Bottom action bar ───────────────────────────────────── */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
              <Link href="/dashboard">
                <Button variant="secondary">
                  ← Save as Draft
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                {!canSubmit && report.expenses.length === 0 && (
                  <p className="text-sm text-slate-400">Add at least one expense to submit.</p>
                )}
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!canSubmit}
                >
                  {isRevision ? "Resubmit Report →" : "Submit Expense Report →"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Read-only notice for submitted/finalized */}
      {!canEdit && report.status !== "finalized" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          This report has been submitted and is awaiting review. No changes can be made until the
          administrator returns it for revisions.
        </div>
      )}
      {report.status === "finalized" && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          ✅ This report has been finalized and filed in your Approved Expense Reports.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible manual expense section
// ---------------------------------------------------------------------------
function ManualExpenseSection({ reportId, onSave }: { reportId: string; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Add Manual Expense
      </button>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Manual Expense</CardTitle>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </CardHeader>
      <ExpenseForm
        reportId={reportId}
        onSave={() => { setOpen(false); onSave(); }}
        onCancel={() => setOpen(false)}
      />
    </Card>
  );
}
