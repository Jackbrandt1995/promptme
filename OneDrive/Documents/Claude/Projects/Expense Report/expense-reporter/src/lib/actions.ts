"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { extractFromReceipt } from "./extraction";
import { sendReportEmail } from "./email";
import { revalidatePath } from "next/cache";
import { v4 as uuid } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ─── Auth Helper ─────────────────────────────────────────────

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

// ─── Receipt Upload & Extraction ─────────────────────────────

export async function uploadAndExtractReceipt(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file") as File;

  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Unsupported file type. Please upload a JPG, PNG, WebP, or PDF." };
  }

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "File is too large. Maximum size is 10 MB." };
  }

  try {
    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || ".jpg";
    const filename = `${uuid()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Extract data from receipt
    const extraction = await extractFromReceipt(buffer, file.name);

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
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
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/receipts");

    return {
      success: true,
      expense,
      extraction,
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message || "Upload failed" };
  }
}

// ─── Expense CRUD ────────────────────────────────────────────

export async function updateExpense(
  expenseId: string,
  data: {
    merchant?: string;
    description?: string;
    amount?: number;
    currency?: string;
    taxAmount?: number;
    transactionDate?: string;
    category?: string;
    paymentMethod?: string;
    reimbursable?: boolean;
    billable?: boolean;
    projectClient?: string;
    status?: string;
  }
) {
  const user = await requireUser();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId: user.id },
  });

  if (!expense) {
    return { success: false, error: "Expense not found" };
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...data,
      // Mark as reviewed once user edits it
      status: data.status || "reviewed",
      flaggedFields: "[]", // Clear flags after user review
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/receipts");
  revalidatePath(`/reports`);

  return { success: true, expense: updated };
}

export async function deleteExpense(expenseId: string) {
  const user = await requireUser();

  await prisma.expense.deleteMany({
    where: { id: expenseId, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/receipts");

  return { success: true };
}

export async function createManualExpense(data: {
  merchant: string;
  description: string;
  amount: number;
  currency?: string;
  taxAmount?: number;
  transactionDate: string;
  category: string;
  paymentMethod?: string;
  reimbursable?: boolean;
  billable?: boolean;
  projectClient?: string;
  reportId?: string;
}) {
  const user = await requireUser();

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      merchant: data.merchant,
      description: data.description,
      amount: data.amount,
      currency: data.currency || "USD",
      taxAmount: data.taxAmount || 0,
      transactionDate: data.transactionDate,
      category: data.category,
      paymentMethod: data.paymentMethod || "",
      reimbursable: data.reimbursable ?? true,
      billable: data.billable ?? false,
      projectClient: data.projectClient || "",
      reportId: data.reportId || null,
      extractionConfidence: 1.0, // Manual entry = full confidence
      status: "reviewed",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { success: true, expense };
}

// ─── Report CRUD ─────────────────────────────────────────────

export async function createReport(data: {
  title: string;
  department?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  businessPurpose?: string;
  projectClient?: string;
  notes?: string;
}) {
  const user = await requireUser();

  const report = await prisma.expenseReport.create({
    data: {
      userId: user.id,
      title: data.title,
      department: data.department || user.department || "",
      dateRangeStart: data.dateRangeStart || "",
      dateRangeEnd: data.dateRangeEnd || "",
      businessPurpose: data.businessPurpose || "",
      projectClient: data.projectClient || "",
      notes: data.notes || "",
      status: "draft",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return { success: true, report };
}

export async function updateReport(
  reportId: string,
  data: {
    title?: string;
    department?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    businessPurpose?: string;
    projectClient?: string;
    notes?: string;
  }
) {
  const user = await requireUser();

  const report = await prisma.expenseReport.findFirst({
    where: { id: reportId, userId: user.id },
  });

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  const updated = await prisma.expenseReport.update({
    where: { id: reportId },
    data,
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);

  return { success: true, report: updated };
}

export async function addExpenseToReport(
  expenseId: string,
  reportId: string
) {
  const user = await requireUser();

  // Verify ownership
  const [expense, report] = await Promise.all([
    prisma.expense.findFirst({ where: { id: expenseId, userId: user.id } }),
    prisma.expenseReport.findFirst({ where: { id: reportId, userId: user.id } }),
  ]);

  if (!expense || !report) {
    return { success: false, error: "Expense or report not found" };
  }

  await prisma.expense.update({
    where: { id: expenseId },
    data: { reportId },
  });

  // Recalculate total
  await recalculateReportTotal(reportId);

  revalidatePath("/dashboard");
  revalidatePath(`/reports/${reportId}`);

  return { success: true };
}

export async function removeExpenseFromReport(expenseId: string) {
  const user = await requireUser();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId: user.id },
  });

  if (!expense || !expense.reportId) {
    return { success: false, error: "Expense not found in any report" };
  }

  const reportId = expense.reportId;

  await prisma.expense.update({
    where: { id: expenseId },
    data: { reportId: null },
  });

  await recalculateReportTotal(reportId);

  revalidatePath(`/reports/${reportId}`);

  return { success: true };
}

async function recalculateReportTotal(reportId: string) {
  const { _sum } = await prisma.expense.aggregate({
    where: { reportId },
    _sum: { amount: true },
  });
  const total = Math.round((_sum.amount ?? 0) * 100) / 100;
  await prisma.expenseReport.update({
    where: { id: reportId },
    data: { totalAmount: total },
  });
}

// ─── Submit Report ───────────────────────────────────────────

export async function submitReport(reportId: string) {
  const user = await requireUser();

  const report = await prisma.expenseReport.findFirst({
    where: { id: reportId, userId: user.id },
    include: {
      expenses: true,
      user: true,
    },
  });

  if (!report) {
    return { success: false, error: "Report not found" };
  }

  if (report.expenses.length === 0) {
    return { success: false, error: "Cannot submit an empty report. Add at least one expense." };
  }

  const submittedAt = new Date().toISOString();

  // Collect receipt file paths for email attachments
  const attachments = report.expenses
    .filter((e) => e.receiptPath)
    .map((e) => ({
      path: path.join(process.cwd(), "public", e.receiptPath!),
      filename: e.receiptFilename || path.basename(e.receiptPath!),
    }));

  // Send email
  const emailResult = await sendReportEmail({
    id: report.id,
    title: report.title,
    department: report.department,
    dateRangeStart: report.dateRangeStart,
    dateRangeEnd: report.dateRangeEnd,
    businessPurpose: report.businessPurpose,
    projectClient: report.projectClient,
    notes: report.notes,
    totalAmount: report.totalAmount,
    submittedAt,
    employee: {
      name: report.user.name,
      email: report.user.email,
      department: report.user.department,
    },
    expenses: report.expenses.map((e) => ({
      merchant: e.merchant,
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      taxAmount: e.taxAmount,
      transactionDate: e.transactionDate,
      category: e.category,
      paymentMethod: e.paymentMethod,
      reimbursable: e.reimbursable,
      billable: e.billable,
      projectClient: e.projectClient,
    })),
    attachments,
  });

  if (!emailResult.success) {
    return {
      success: false,
      error: `Failed to send email: ${emailResult.error}`,
    };
  }

  // Update report and expense statuses
  await prisma.expenseReport.update({
    where: { id: reportId },
    data: {
      status: "submitted",
      submittedAt,
      adminEmail: process.env.ADMIN_EMAIL || "",
    },
  });

  await prisma.expense.updateMany({
    where: { reportId },
    data: { status: "submitted" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);

  return {
    success: true,
    messageId: emailResult.messageId,
  };
}

// ─── Data Fetching ───────────────────────────────────────────

export async function getDashboardData() {
  const user = await requireUser();

  const [recentReports, draftExpenses, allExpenses] = await Promise.all([
    prisma.expenseReport.findMany({
      where: { userId: user.id },
      include: { expenses: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.expense.findMany({
      where: { userId: user.id, reportId: null },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    user,
    recentReports,
    draftExpenses,
    totalExpenses: allExpenses.length,
  };
}

export async function getReportWithExpenses(reportId: string) {
  const user = await requireUser();

  const report = await prisma.expenseReport.findFirst({
    where: { id: reportId, userId: user.id },
    include: {
      expenses: { orderBy: { transactionDate: "asc" } },
    },
  });

  if (!report) return null;

  // Also get unattached expenses for adding
  const unattachedExpenses = await prisma.expense.findMany({
    where: { userId: user.id, reportId: null },
    orderBy: { createdAt: "desc" },
  });

  return { report, unattachedExpenses };
}

export async function getUserReports() {
  const user = await requireUser();

  return prisma.expenseReport.findMany({
    where: { userId: user.id },
    include: {
      expenses: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getUserExpenses() {
  const user = await requireUser();

  return prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}
