import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSuggestionsForUser } from "@/lib/suggestions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await getSuggestionsForUser(session.user.id);
  return NextResponse.json(suggestions);
}
