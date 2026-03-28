"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, EmptyState, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReceiptUploader } from "@/components/receipts/ReceiptUploader";
import { ExpenseForm } from "@/components/receipts/ExpenseForm";
import { MileageForm } from "@/components/receipts/MileageForm";
import { SuggestionCards } from "@/components/suggestions/SuggestionCards";
import { formatCurrency, formatDate, getCategoryIcon } from "@/lib/utils";
import { createReport } from "@/lib/actions";

interface DashboardClientProps {
  user: any;
  recentReports: any[];
  draftExpenses: any[];
  draftReportCount: number;
  submittedCount: number;
  totalPending: number;
}

export function DashboardClient({
  user,
  recentReports,
  draftExpenses,
  draftReportCount,
  submittedCount,
  totalPending,
}: DashboardClientProps) {
  const router = useRouter();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showMileageForm, setShowMileageForm] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [creatingReport, setCreatingReport] = useState(false);

  const handleUploadComplete = () => {
    router.refresh();
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setPrefillData({
      merchant: suggestion.merchant,
      description: suggestion.description,
      amount: suggestion.amount,
      category: suggestion.category,
      paymentMethod: suggestion.paymentMethod,
      currency: suggestion.currency,
    });
    setShowExpenseForm(true);
  };

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

  const statusBadge = (status: string) => {
    const map: Record<string, "default" | "success" | "warning" | "info"> = {
      draft: "default",
      submitted: "info",
      approved: "success",
      rejected: "warning",
    };
    return <Badge variant={map[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.name?.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your expenses and submit reports in minutes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => { setShowMileageForm(true); setShowExpenseForm(false); }}>
            Log Mileage
          </Button>
          <Button variant="secondary" onClick={() => { setShowExpenseForm(true); setShowMileageForm(false); }}>
            + Manual Expense
          </Button>
          <Button onClick={handleNewReport} loading={creatingReport}>
            + New Report
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Unattached Expenses</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {draftExpenses.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatCurrency(totalPending)} pending
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Draft Reports</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {draftReportCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">Ready to complete</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Submitted Reports</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {submittedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">This period</p>
        </Card>
      </div>

      {/* Receipt Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
        </CardHeader>
        <ReceiptUploader onUploadComplete={handleUploadComplete} />
      </Card>

      {/* Suggestions */}
      <SuggestionCards onSelect={handleSuggestionSelect} />

      {/* Mileage form */}
      {showMileageForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log Mileage</CardTitle>
          </CardHeader>
          <MileageForm
            onSave={() => {
              setShowMileageForm(false);
              router.refresh();
            }}
            onCancel={() => setShowMileageForm(false)}
          />
        </Card>
      )}

      {/* Manual expense form (modal-style) */}
      {showExpenseForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {prefillData ? "Add Suggested Expense" : "Add Manual Expense"}
            </CardTitle>
          </CardHeader>
          <ExpenseForm
            prefill={prefillData || undefined}
            onSave={() => {
              setShowExpenseForm(false);
              setPrefillData(null);
              router.refresh();
            }}
            onCancel={() => {
              setShowExpenseForm(false);
              setPrefillData(null);
            }}
          />
        </Card>
      )}

      {/* Two-column layout: Draft Expenses + Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unattached expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Unattached Expenses</CardTitle>
            <Link
              href="/receipts"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </CardHeader>
          {draftExpenses.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No loose expenses"
              description="Upload a receipt or add an expense manually to get started."
            />
          ) : (
            <div className="space-y-2">
              {draftExpenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg">
                    {getCategoryIcon(expense.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {expense.merchant || "Unknown merchant"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(expense.transactionDate)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <Link
              href="/reports"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </CardHeader>
          {recentReports.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No reports yet"
              description="Create your first expense report to organize and submit your expenses."
              action={
                <Button onClick={handleNewReport} loading={creatingReport}>
                  Create Report
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {recentReports.slice(0, 5).map((report) => (
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
                      {report.expenses.length} expense(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(report.totalAmount)}
                    </p>
                    {statusBadge(report.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
