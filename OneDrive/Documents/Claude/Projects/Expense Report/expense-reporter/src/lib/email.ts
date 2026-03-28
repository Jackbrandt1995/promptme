/**
 * Email Service
 *
 * Abstraction for sending expense report submissions.
 * Uses Nodemailer with SMTP. Falls back to console logging in dev.
 */

import nodemailer from "nodemailer";
import { formatCurrency, formatDate, getCategoryLabel } from "./utils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ExpenseForEmail {
  merchant: string;
  description: string;
  amount: number;
  currency: string;
  taxAmount: number;
  transactionDate: string;
  category: string;
  paymentMethod: string;
  reimbursable: boolean;
  billable: boolean;
  projectClient: string;
}

interface ReportForEmail {
  id: string;
  title: string;
  department: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  businessPurpose: string;
  projectClient: string;
  notes: string;
  totalAmount: number;
  submittedAt: string;
  employee: {
    name: string;
    email: string;
    department: string;
  };
  expenses: ExpenseForEmail[];
  attachments?: { path: string; filename: string }[];
}

function buildExpenseRow(expense: ExpenseForEmail, index: number): string {
  return `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 8px; font-size: 14px;">${index + 1}</td>
      <td style="padding: 12px 8px; font-size: 14px;">${formatDate(expense.transactionDate)}</td>
      <td style="padding: 12px 8px; font-size: 14px; font-weight: 500;">${escapeHtml(expense.merchant)}</td>
      <td style="padding: 12px 8px; font-size: 14px;">${escapeHtml(getCategoryLabel(expense.category))}</td>
      <td style="padding: 12px 8px; font-size: 14px;">${escapeHtml(expense.description)}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: right;">${formatCurrency(expense.amount, expense.currency)}</td>
      <td style="padding: 12px 8px; font-size: 14px; text-align: right;">${formatCurrency(expense.taxAmount, expense.currency)}</td>
    </tr>
  `;
}

function buildEmailHtml(report: ReportForEmail): string {
  const expenseRows = report.expenses.map((e, i) => buildExpenseRow(e, i)).join("");
  const totalTax = report.expenses.reduce((sum, e) => sum + e.taxAmount, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 700px; margin: 0 auto; padding: 24px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0; padding: 32px; color: white;">
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600;">Expense Report Submitted</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">Report ID: ${report.id}</p>
    </div>

    <!-- Body -->
    <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <!-- Report Info -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">${escapeHtml(report.title)}</h2>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #6b7280; width: 140px;">Employee</td>
            <td style="padding: 4px 0; color: #1f2937; font-weight: 500;">${escapeHtml(report.employee.name)} (${escapeHtml(report.employee.email)})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Department</td>
            <td style="padding: 4px 0; color: #1f2937;">${escapeHtml(report.department || report.employee.department)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Date Range</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatDate(report.dateRangeStart)} – ${formatDate(report.dateRangeEnd)}</td>
          </tr>
          ${report.projectClient ? `
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Project / Client</td>
            <td style="padding: 4px 0; color: #1f2937;">${escapeHtml(report.projectClient)}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Business Purpose</td>
            <td style="padding: 4px 0; color: #1f2937;">${escapeHtml(report.businessPurpose)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6b7280;">Submitted</td>
            <td style="padding: 4px 0; color: #1f2937;">${formatDate(report.submittedAt)}</td>
          </tr>
        </table>
      </div>

      <!-- Expenses Table -->
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">Itemized Expenses (${report.expenses.length})</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">#</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Date</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Merchant</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Category</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Description</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Amount</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase;">Tax</th>
            </tr>
          </thead>
          <tbody>
            ${expenseRows}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #1f2937;">
              <td colspan="5" style="padding: 12px 8px; font-size: 14px; font-weight: 600; text-align: right;">Total</td>
              <td style="padding: 12px 8px; font-size: 16px; font-weight: 700; text-align: right; color: #1d4ed8;">${formatCurrency(report.totalAmount)}</td>
              <td style="padding: 12px 8px; font-size: 14px; font-weight: 500; text-align: right; color: #6b7280;">${formatCurrency(totalTax)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      ${report.notes ? `
      <!-- Notes -->
      <div style="margin-top: 16px; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Notes</h4>
        <p style="margin: 0; font-size: 14px; color: #1f2937;">${escapeHtml(report.notes)}</p>
      </div>
      ` : ""}

      <!-- Footer -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          This report was generated by ExpenseBot — your company's expense reporting tool.
          <br>Please review and respond directly to the submitter.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function buildPlainText(report: ReportForEmail): string {
  let text = `EXPENSE REPORT SUBMITTED\n`;
  text += `========================\n\n`;
  text += `Report: ${report.title}\n`;
  text += `ID: ${report.id}\n`;
  text += `Employee: ${report.employee.name} (${report.employee.email})\n`;
  text += `Department: ${report.department || report.employee.department}\n`;
  text += `Date Range: ${formatDate(report.dateRangeStart)} – ${formatDate(report.dateRangeEnd)}\n`;
  text += `Business Purpose: ${report.businessPurpose}\n`;
  if (report.projectClient) text += `Project/Client: ${report.projectClient}\n`;
  text += `Submitted: ${formatDate(report.submittedAt)}\n\n`;

  text += `ITEMIZED EXPENSES\n`;
  text += `------------------\n`;
  report.expenses.forEach((e, i) => {
    text += `${i + 1}. ${formatDate(e.transactionDate)} | ${e.merchant} | ${getCategoryLabel(e.category)} | ${formatCurrency(e.amount)} | ${e.description}\n`;
  });
  text += `\nTOTAL: ${formatCurrency(report.totalAmount)}\n`;

  if (report.notes) {
    text += `\nNotes: ${report.notes}\n`;
  }

  return text;
}

export async function sendReportEmail(report: ReportForEmail): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "ExpenseBot <noreply@company.com>";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@company.com";

  // If SMTP is not configured, log to console (dev mode)
  if (!user || !pass) {
    console.log("\n📧 ===== EMAIL WOULD BE SENT =====");
    console.log(`To: ${adminEmail}`);
    console.log(`From: ${from}`);
    console.log(`Subject: Expense Report: ${report.title} — ${formatCurrency(report.totalAmount)}`);
    if (report.attachments && report.attachments.length > 0) {
      console.log(`Attachments (${report.attachments.length}):`);
      report.attachments.forEach((a) => console.log(`  - ${a.filename}`));
    }
    console.log("Body (plain text):");
    console.log(buildPlainText(report));
    console.log("===== END EMAIL =====\n");

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const result = await transporter.sendMail({
      from,
      to: adminEmail,
      replyTo: report.employee.email,
      subject: `Expense Report: ${report.title} — ${formatCurrency(report.totalAmount)}`,
      text: buildPlainText(report),
      html: buildEmailHtml(report),
      attachments: (report.attachments ?? []).map((a) => ({
        filename: a.filename,
        path: a.path,
      })),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}
