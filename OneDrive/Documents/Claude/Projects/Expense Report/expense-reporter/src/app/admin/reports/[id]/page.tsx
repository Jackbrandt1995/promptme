import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReviewClient } from "./ReviewClient";

export default async function AdminReportReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await prisma.expenseReport.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
      expenses: { orderBy: { transactionDate: "asc" } },
    },
  });

  if (!report) notFound();

  return <ReviewClient report={JSON.parse(JSON.stringify(report))} />;
}
