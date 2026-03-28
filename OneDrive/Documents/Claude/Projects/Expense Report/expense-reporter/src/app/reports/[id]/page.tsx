import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReportDetailClient } from "./ReportDetailClient";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const report = await prisma.expenseReport.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      expenses: { orderBy: { transactionDate: "asc" } },
    },
  });

  if (!report) notFound();

  const unattachedExpenses = await prisma.expense.findMany({
    where: { userId: session.user.id, reportId: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ReportDetailClient
      report={JSON.parse(JSON.stringify(report))}
      unattachedExpenses={JSON.parse(JSON.stringify(unattachedExpenses))}
      user={session.user}
    />
  );
}
