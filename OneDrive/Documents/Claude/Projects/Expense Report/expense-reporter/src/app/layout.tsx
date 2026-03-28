import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "ExpenseBot — Smart Expense Reporting",
  description: "Upload receipts, auto-extract data, and submit expense reports with ease.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
