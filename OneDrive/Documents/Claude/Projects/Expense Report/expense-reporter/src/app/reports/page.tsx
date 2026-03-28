import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReportsListClient } from "./ReportsListClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const reports = await prisma.expenseReport.findMany({
    where: { userId: session.user.id },
    include: { expenses: true },
    orderBy: { updatedAt: "desc" },
  });

  return <ReportsListClient reports={JSON.parse(JSON.stringify(reports))} />;
}
