"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AdminClientProps {
  reports: any[];
}

const STATUS_INFO: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }> = {
  submitted:           { label: "Needs Review",      variant: "info" },
  revision_requested:  { label: "Revisions Sent",    variant: "warning" },
  approved:            { label: "Approved",          variant: "success" },
  rejected:            { label: "Rejected",          variant: "danger" },
  finalized:           { label: "Finalized",         variant: "success" },
};

export function AdminClient({ reports }: AdminClientProps) {
  const pending   = reports.filter((r) => r.status === "submitted");
  const inProcess = reports.filter((r) => r.status === "revision_requested");
  const completed = reports.filter((r) => r.status === "approved" || r.status === "rejected" || r.status === "finalized");

  const ReportRow = ({ report }: { report: any }) => {
    const info = STATUS_INFO[report.status] ?? { label: report.status, variant: "default" as const };
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {report.title || "Untitled Report"}
            </p>
            <Badge variant={info.variant}>{info.label}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {report.user.name} · {report.user.department || report.user.email}
            {report.submittedAt && ` · Submitted ${formatDate(report.submittedAt)}`}
          </p>
          <p className="text-xs text-slate-400">
            {report.expenses.length} line item(s)
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-900">{formatCurrency(report.totalAmount)}</p>
        </div>
        <Link href={`/admin/reports/${report.id}`}>
          <Button variant="secondary" size="sm">
            Review →
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin — Expense Reports</h1>
        <p className="text-slate-500 mt-1">
          Review submitted reports, accept or decline line items, and mark reports as final.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pending.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Awaiting Resubmission</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{inProcess.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completed.length}</p>
        </Card>
      </div>

      {/* Pending review */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Review ({pending.length})</CardTitle>
        </CardHeader>
        {pending.length === 0 ? (
          <EmptyState icon="✅" title="All caught up!" description="No reports are waiting for review." />
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.map((r) => <ReportRow key={r.id} report={r} />)}
          </div>
        )}
      </Card>

      {/* Awaiting resubmission */}
      {inProcess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Awaiting Resubmission ({inProcess.length})</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {inProcess.map((r) => <ReportRow key={r.id} report={r} />)}
          </div>
        </Card>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed ({completed.length})</CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {completed.map((r) => <ReportRow key={r.id} report={r} />)}
          </div>
        </Card>
      )}

      {reports.length === 0 && (
        <EmptyState
          icon="📭"
          title="No reports submitted yet"
          description="Expense reports from employees will appear here once submitted."
        />
      )}
    </div>
  );
}
