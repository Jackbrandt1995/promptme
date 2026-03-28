import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkDuplicates } from "@/lib/suggestions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await checkDuplicates(
    session.user.id,
    body.merchant,
    body.amount,
    body.transactionDate
  );

  return NextResponse.json(result);
}
