import { prisma } from "@/lib/db";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const reports = await prisma.expenseReport.findMany({
    where: {
      status: { in: ["submitted", "revision_requested", "approved", "rejected", "finalized"] },
    },
    include: {
      user: { select: { id: true, name: true, email: true, department: true } },
      expenses: { select: { id: true, amount: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  return <AdminClient reports={JSON.parse(JSON.stringify(reports))} />;
}
