import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [allReports] = await Promise.all([
    prisma.expenseReport.findMany({
      where: { userId },
      include: { expenses: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const activeReports  = allReports.filter((r) => r.status !== "finalized");
  const approvedReports = allReports.filter((r) => r.status === "finalized");
  const submittedCount  = allReports.filter((r) => r.status === "submitted").length;

  return (
    <DashboardClient
      user={session.user}
      activeReports={JSON.parse(JSON.stringify(activeReports))}
      approvedReports={JSON.parse(JSON.stringify(approvedReports))}
      submittedCount={submittedCount}
    />
  );
}
