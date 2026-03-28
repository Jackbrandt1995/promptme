"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createReport } from "@/lib/actions";
import { useState } from "react";

interface ReportsListClientProps {
  reports: any[];
}

export function ReportsListClient({ reports }: ReportsListClientProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleNewReport = async () => {
    setCreating(true);
    const result = await createReport({
      title: `Expense Report — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    });
    if (result.success && result.report) {
      router.push(`/reports/${result.report.id}`);
    }
    setCreating(false);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "success" | "warning" | "info"> = {
      draft: "default",
      submitted: "info",
      approved: "success",
      rejected: "warning",
    };
    return <Badge variant={map[status] || "default"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expense Reports</h1>
          <p className="text-slate-500 mt-1">{reports.length} reports</p>
        </div>
        <Button onClick={handleNewReport} loading={creating}>
          + New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <EmptyState
            icon="📊"
            title="No reports yet"
            description="Create your first expense report to organize expenses and submit for reimbursement."
            action={
              <Button onClick={handleNewReport} loading={creating}>
                Create Your First Report
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-slate-900 truncate">
                        {report.title || "Untitled Report"}
                      </h3>
                      {statusBadge(report.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      {report.expenses.length} expense(s)
                      {report.businessPurpose && ` · ${report.businessPurpose}`}
                    </p>
                    {report.dateRangeStart && report.dateRangeEnd && (
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(report.dateRangeStart)} — {formatDate(report.dateRangeEnd)}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(report.totalAmount)}
                    </p>
                    {report.submittedAt && (
                      <p className="text-xs text-slate-400">
                        Submitted {formatDate(report.submittedAt.split("T")[0])}
                      </p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
