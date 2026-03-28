import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReceiptsClient } from "./ReceiptsClient";

export default async function ReceiptsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { report: true },
  });

  return <ReceiptsClient expenses={JSON.parse(JSON.stringify(expenses))} />;
}
