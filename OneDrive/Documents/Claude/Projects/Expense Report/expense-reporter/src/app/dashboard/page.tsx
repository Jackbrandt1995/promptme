import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [recentReports, draftExpenses, submittedCount] = await Promise.all([
    prisma.expenseReport.findMany({
      where: { userId },
      include: { expenses: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { userId, reportId: null },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.expenseReport.count({
      where: { userId, status: "submitted" },
    }),
  ]);

  const totalPending = draftExpenses.reduce((sum, e) => sum + e.amount, 0);
  const draftReports = recentReports.filter((r) => r.status === "draft");

  return (
    <DashboardClient
      user={session.user}
      recentReports={JSON.parse(JSON.stringify(recentReports))}
      draftExpenses={JSON.parse(JSON.stringify(draftExpenses))}
      draftReportCount={draftReports.length}
      submittedCount={submittedCount}
      totalPending={totalPending}
    />
  );
}
