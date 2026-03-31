"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createReport } from "@/lib/actions";

interface DashboardClientProps {
  user: any;
  activeReports: any[];     // draft + submitted + revision_requested + approved
  approvedReports: any[];   // finalized reports
  submittedCount: number;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }> = {
  draft:               { label: "Draft",              variant: "default" },
  submitted:           { label: "Submitted",          variant: "info" },
  revision_requested:  { label: "Revisions Needed",   variant: "warning" },
  approved:            { label: "Approved",           variant: "success" },
  rejected:            { label: "Rejected",           variant: "danger" },
  finalized:           { label: "Finalized",          variant: "success" },
};

export function DashboardClient({
  user,
  activeReports,
  approvedReports,
  submittedCount,
}: DashboardClientProps) {
  const router = useRouter();
  const [creatingReport, setCreatingReport] = useState(false);

  const handleNewReport = async () => {
    setCreatingReport(true);
    const result = await createReport({
      title: `Expense Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      department: user.department,
    });
    if (result.success && result.report) {
      router.push(`/reports/${result.report.id}`);
    }
    setCreatingReport(false);
  };

  const draftReports   = activeReports.filter((r) => r.status === "draft");
  const revisionReports = activeReports.filter((r) => r.status === "revision_requested");

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome Header ─────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user.name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">
          Create an expense report and add receipts or mileage as you go.
        </p>
      </div>

      {/* ── Revisions Needed banner ──────────────────────────────────── */}
      {revisionReports.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">
                {revisionReports.length === 1
                  ? "1 report needs revisions"
                  : `${revisionReports.length} reports need revisions`}
              </p>
              <p className="text-sm text-amber-600">
                Your administrator has returned{" "}
                {revisionReports.length === 1 ? "a report" : "reports"} with
                notes. Review and resubmit.
              </p>
            </div>
          </div>
          <Link href="/reports">
            <Button variant="secondary" size="sm">
              View Reports
            </Button>
          </Link>
        </div>
      )}

      {/* ── Create Report CTA ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold">Start a New Expense Report</h2>
            <p className="text-blue-100 mt-1 text-sm">
              Create a report first, then upload receipts and log mileage
              directly to it. Submit when you&apos;re ready.
            </p>
          </div>
          <button
            onClick={handleNewReport}
            disabled={creatingReport}
            className="shrink-0 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-60 shadow-sm"
          >
            {creatingReport ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating…
              </>
            ) : (
              <>+ Create Expense Report</>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Draft Reports</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{draftReports.length}</p>
          <p className="text-xs text-slate-400 mt-1">In progress</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Submitted Reports</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{submittedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting review</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Approved Reports</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedReports.length}</p>
          <p className="text-xs text-slate-400 mt-1">Finalized</p>
        </Card>
      </div>

      {/* ── Active Reports ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Active Reports</CardTitle>
          <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </CardHeader>

        {activeReports.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No active reports"
            description="Click &quot;Create Expense Report&quot; above to get started."
          />
        ) : (
          <div className="space-y-2 mt-2">
            {activeReports.slice(0, 6).map((report) => {
              const info = STATUS_BADGE[report.status] ?? { label: report.status, variant: "default" as const };
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {report.title || "Untitled Report"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {report.expenses.length} expense(s) · Updated {formatDate(report.updatedAt)}
                    </p>
                    {report.status === "revision_requested" && report.adminNotes && (
                      <p className="text-xs text-amber-600 mt-0.5 truncate">
                        ⚠ Admin: {report.adminNotes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(report.totalAmount)}
                    </p>
                    <Badge variant={info.variant as any}>{info.label}</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Approved Expense Reports ─────────────────────────────────── */}
      {approvedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Approved Expense Reports</CardTitle>
          </CardHeader>
          <div className="space-y-2 mt-2">
            {approvedReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {report.title || "Untitled Report"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {report.expenses.length} expense(s) · Finalized{" "}
                    {formatDate(report.updatedAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-green-700 shrink-0">
                  {formatCurrency(report.totalAmount)}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
