"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { formatCurrency, formatDate, getCategoryIcon, getCategoryLabel } from "@/lib/utils";
import {
  adminReviewReport,
  adminReviewLineItem,
  finalizeReport,
} from "@/lib/actions";

interface ReviewClientProps {
  report: any;
}

const LINE_ITEM_STATUS_OPTIONS = [
  { value: "accepted",       label: "✓ Accept",          cls: "bg-green-600 hover:bg-green-700 text-white" },
  { value: "needs_revision", label: "⚠ Request Revision", cls: "bg-amber-500 hover:bg-amber-600 text-white" },
  { value: "declined",       label: "✕ Decline",          cls: "bg-red-600 hover:bg-red-700 text-white" },
];

const LI_BADGE: Record<string, { label: string; cls: string }> = {
  accepted:       { label: "✓ Accepted",       cls: "text-green-700 bg-green-50 border border-green-200" },
  declined:       { label: "✕ Declined",       cls: "text-red-700 bg-red-50 border border-red-200" },
  needs_revision: { label: "⚠ Needs Revision", cls: "text-amber-700 bg-amber-50 border border-amber-200" },
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  submitted:           "bg-blue-100 text-blue-700",
  revision_requested:  "bg-amber-100 text-amber-700",
  approved:            "bg-green-100 text-green-700",
  rejected:            "bg-red-100 text-red-700",
  finalized:           "bg-emerald-100 text-emerald-800",
};

export function ReviewClient({ report: initialReport }: ReviewClientProps) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);

  // Per-line-item state: expenseId → { status, notes, saving }
  const [lineItems, setLineItems] = useState<Record<string, { notes: string; saving: boolean }>>(
    Object.fromEntries(report.expenses.map((e: any) => [e.id, { notes: e.adminLineItemNotes ?? "", saving: false }]))
  );

  // Report-level review
  const [reportNotes, setReportNotes] = useState(report.adminNotes ?? "");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | "revision_requested" | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");

  const isFinalized = report.status === "finalized";
  const isCompleted = ["approved", "rejected", "finalized"].includes(report.status);

  // ── Per-line-item review ─────────────────────────────────────────────────
  const handleLineItemReview = async (expenseId: string, status: "accepted" | "declined" | "needs_revision") => {
    setLineItems((prev) => ({ ...prev, [expenseId]: { ...prev[expenseId], saving: true } }));
    const notes = lineItems[expenseId]?.notes ?? "";

    const result = await adminReviewLineItem(expenseId, status, notes);

    if (result.success) {
      // optimistic update
      setReport((prev: any) => ({
        ...prev,
        expenses: prev.expenses.map((e: any) =>
          e.id === expenseId
            ? { ...e, lineItemStatus: status, adminLineItemNotes: notes }
            : e
        ),
      }));
    } else {
      setError(result.error ?? "Failed to save line item.");
    }

    setLineItems((prev) => ({ ...prev, [expenseId]: { ...prev[expenseId], saving: false } }));
  };

  // ── Report-level review ──────────────────────────────────────────────────
  const handleReportReview = async () => {
    if (!reviewAction) return;
    setSubmittingReview(true);
    setError("");

    const result = await adminReviewReport(report.id, reviewAction, reportNotes);

    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error ?? "Review failed.");
      setSubmittingReview(false);
    }
  };

  // ── Mark as Final ────────────────────────────────────────────────────────
  const handleFinalize = async () => {
    if (!confirm("Mark this report as final? This will file it into the employee's Approved Expense Reports.")) return;
    setFinalizing(true);
    setError("");
    const result = await finalizeReport(report.id);
    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error ?? "Finalize failed.");
      setFinalizing(false);
    }
  };

  const statusLabel =
    report.status === "revision_requested" ? "Revisions Sent"
    : report.status === "finalized"        ? "Finalized"
    : report.status.charAt(0).toUpperCase() + report.status.slice(1);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block">
          ← Back to Admin
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {report.title || "Untitled Report"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${REPORT_STATUS_COLORS[report.status] ?? "bg-slate-100 text-slate-700"}`}>
                {statusLabel}
              </span>
              <span className="text-sm text-slate-500">
                {report.user.name} · {report.user.department || report.user.email}
              </span>
            </div>
            {report.submittedAt && (
              <p className="text-xs text-slate-400 mt-1">
                Submitted {formatDate(report.submittedAt)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(report.totalAmount)}</p>
            <p className="text-xs text-slate-400">{report.expenses.length} line item(s)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Report Details ──────────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Report Details</CardTitle></CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm mt-3">
          <div><span className="text-slate-500">Employee:</span>{" "}<span className="font-medium">{report.user.name}</span></div>
          <div><span className="text-slate-500">Department:</span>{" "}<span className="font-medium">{report.department || "—"}</span></div>
          <div>
            <span className="text-slate-500">Date Range:</span>{" "}
            <span className="font-medium">
              {report.dateRangeStart && report.dateRangeEnd
                ? `${formatDate(report.dateRangeStart)} — ${formatDate(report.dateRangeEnd)}`
                : "—"}
            </span>
          </div>
          <div><span className="text-slate-500">Business Purpose:</span>{" "}<span className="font-medium">{report.businessPurpose || "—"}</span></div>
          <div><span className="text-slate-500">Project/Client:</span>{" "}<span className="font-medium">{report.projectClient || "—"}</span></div>
          {report.notes && (
            <div className="col-span-2"><span className="text-slate-500">Notes:</span>{" "}{report.notes}</div>
          )}
        </div>
      </Card>

      {/* ── Line Items ──────────────────────────────────────────────── */}
      <Card padding={false}>
        <div className="p-6 pb-3">
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <p className="text-sm text-slate-500">Review each expense individually, then submit your decision for the whole report below.</p>
          </CardHeader>
        </div>

        <div className="divide-y divide-slate-100">
          {report.expenses.map((expense: any, i: number) => {
            const li = lineItems[expense.id];
            const badge = expense.lineItemStatus ? LI_BADGE[expense.lineItemStatus] : null;

            return (
              <div key={expense.id} className="px-6 py-5 space-y-3">
                {/* Expense info row */}
                <div className="flex items-start gap-4">
                  <span className="text-sm font-medium text-slate-400 w-6 mt-0.5">{i + 1}</span>
                  <span className="text-xl flex-shrink-0">{getCategoryIcon(expense.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900">{expense.merchant || "Unknown"}</p>
                      {badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(expense.transactionDate)} · {getCategoryLabel(expense.category)}
                      {expense.description && ` · ${expense.description}`}
                    </p>
                    {expense.receiptPath && (
                      <a
                        href={expense.receiptPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 mt-0.5 inline-block"
                      >
                        View receipt ↗
                      </a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
                    {expense.taxAmount > 0 && (
                      <p className="text-xs text-slate-400">+{formatCurrency(expense.taxAmount)} tax</p>
                    )}
                  </div>
                </div>

                {/* Admin notes input + action buttons */}
                {!isFinalized && (
                  <div className="ml-10 space-y-2">
                    <input
                      type="text"
                      value={li?.notes ?? ""}
                      onChange={(e) => setLineItems((prev) => ({
                        ...prev,
                        [expense.id]: { ...prev[expense.id], notes: e.target.value },
                      }))}
                      placeholder="Optional note for this line item…"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    />
                    <div className="flex flex-wrap gap-2">
                      {LINE_ITEM_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleLineItemReview(expense.id, opt.value as any)}
                          disabled={li?.saving}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                            expense.lineItemStatus === opt.value
                              ? opt.cls + " ring-2 ring-offset-1 ring-current"
                              : opt.cls.replace("bg-", "bg-opacity-10 bg-") + " border border-current " + opt.cls.split(" ").find((c) => c.startsWith("text-")) + " bg-white hover:opacity-90"
                          }`}
                          style={expense.lineItemStatus === opt.value ? {} : {
                            backgroundColor: "white",
                            color: opt.value === "accepted" ? "#15803d" : opt.value === "needs_revision" ? "#b45309" : "#b91c1c",
                            border: `1px solid ${opt.value === "accepted" ? "#86efac" : opt.value === "needs_revision" ? "#fcd34d" : "#fca5a5"}`,
                          }}
                        >
                          {li?.saving ? "Saving…" : opt.label}
                        </button>
                      ))}
                    </div>
                    {expense.adminLineItemNotes && (
                      <p className="text-xs text-slate-500 italic">Saved note: {expense.adminLineItemNotes}</p>
                    )}
                  </div>
                )}
                {isFinalized && expense.adminLineItemNotes && (
                  <p className="ml-10 text-xs text-slate-500 italic">Note: {expense.adminLineItemNotes}</p>
                )}
              </div>
            );
          })}

          {/* Total row */}
          <div className="flex items-center gap-4 px-6 py-4 bg-slate-50">
            <span className="w-6" />
            <span className="text-xl">💰</span>
            <div className="flex-1"><p className="text-sm font-semibold text-slate-900">Total</p></div>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(report.totalAmount)}</p>
          </div>
        </div>
      </Card>

      {/* ── Report Decision ──────────────────────────────────────────── */}
      {!isFinalized && (
        <Card>
          <CardHeader>
            <CardTitle>Report Decision</CardTitle>
          </CardHeader>
          <div className="space-y-4 mt-3">
            <Textarea
              label="Notes to Employee (visible when returning for revisions or with rejection)"
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={3}
              placeholder="Explain what needs to change, or leave a note for the employee…"
            />

            {/* Action selector */}
            <div className="flex flex-wrap gap-3">
              {(["approved", "revision_requested", "rejected"] as const).map((action) => {
                const labels = {
                  approved:            "✅ Approve Report",
                  revision_requested:  "⚠ Return for Revisions",
                  rejected:            "✕ Reject Report",
                };
                const colors = {
                  approved:           "border-green-400 bg-green-50 text-green-700",
                  revision_requested: "border-amber-400 bg-amber-50 text-amber-700",
                  rejected:           "border-red-400 bg-red-50 text-red-700",
                };
                const selected = reviewAction === action;
                return (
                  <button
                    key={action}
                    onClick={() => setReviewAction(action)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selected
                        ? colors[action] + " ring-2 ring-offset-1"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {labels[action]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleReportReview}
                loading={submittingReview}
                disabled={!reviewAction}
              >
                Submit Decision
              </Button>
              <Link href="/admin">
                <Button variant="ghost">Cancel</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Mark as Final (only shown when approved) ──────────────────── */}
      {report.status === "approved" && (
        <div className="p-5 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-green-800">Ready to finalize?</p>
            <p className="text-sm text-green-600 mt-0.5">
              Marking as final files this report into the employee&apos;s Approved Expense Reports folder.
            </p>
          </div>
          <Button onClick={handleFinalize} loading={finalizing}>
            Mark as Final ✓
          </Button>
        </div>
      )}

      {/* ── Finalized notice ──────────────────────────────────────────── */}
      {isFinalized && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          ✅ This report has been finalized and filed into the employee&apos;s Approved Expense Reports.
        </div>
      )}
    </div>
  );
}
