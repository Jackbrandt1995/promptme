import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractFromReceipt } from "@/lib/extraction";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Verify user still exists in DB (session can be stale after db:reset)
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) {
    return NextResponse.json(
      { success: false, error: "Your session has expired. Please sign out and sign back in." },
      { status: 401 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "Unsupported file type. Please upload a JPG, PNG, WebP, or PDF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: "File is too large. Maximum size is 10 MB." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuid()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Optional: attach directly to a report
    const reportId = formData.get("reportId") as string | null;

    // Validate reportId belongs to this user if provided
    if (reportId) {
      const report = await prisma.expenseReport.findFirst({
        where: { id: reportId, userId: session.user.id },
      });
      if (!report) {
        return NextResponse.json(
          { success: false, error: "Report not found." },
          { status: 400 }
        );
      }
    }

    // OCR / text extraction — runs correctly in a Route Handler
    const extraction = await extractFromReceipt(buffer, file.name);

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        merchant: extraction.merchant,
        description: extraction.description,
        amount: extraction.amount,
        currency: extraction.currency,
        taxAmount: extraction.taxAmount,
        transactionDate: extraction.transactionDate,
        category: extraction.category,
        paymentMethod: extraction.paymentMethod,
        receiptPath: `/uploads/${filename}`,
        receiptFilename: file.name,
        extractionConfidence: extraction.confidence,
        extractionData: JSON.stringify(extraction),
        flaggedFields: JSON.stringify(extraction.flaggedFields),
        status: "draft",
        ...(reportId ? { reportId } : {}),
      },
    });

    // If attached to a report, recalculate total
    if (reportId) {
      const { _sum } = await prisma.expense.aggregate({
        where: { reportId },
        _sum: { amount: true },
      });
      await prisma.expenseReport.update({
        where: { id: reportId },
        data: { totalAmount: Math.round((_sum.amount ?? 0) * 100) / 100 },
      });
    }

    return NextResponse.json({ success: true, expense, extraction });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed." },
      { status: 500 }
    );
  }
}
