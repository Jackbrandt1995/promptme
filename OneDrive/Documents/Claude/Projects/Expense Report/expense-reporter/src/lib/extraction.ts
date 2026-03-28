/**
 * Receipt Extraction Service
 *
 * Uses Tesseract.js for image OCR and pdf-parse for PDF text extraction.
 * All extracted text is fed through parseReceiptText() for structured parsing.
 */

export interface ExtractionResult {
  merchant: string;
  amount: number;
  taxAmount: number;
  transactionDate: string;
  currency: string;
  category: string;
  description: string;
  paymentMethod: string;
  confidence: number;
  rawText: string;
  flaggedFields: string[];
}

// Pattern matchers for receipt parsing
const AMOUNT_PATTERNS = [
  /(?:total|amount|due|charge|sum)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
  /\$\s*([\d,]+\.\d{2})/,
  /(?:USD|EUR|GBP)\s*([\d,]+\.\d{2})/i,
  /([\d,]+\.\d{2})\s*(?:USD|EUR|GBP)/i,
];

const TAX_PATTERNS = [
  /(?:tax|hst|gst|vat)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
  /(?:sales\s*tax)[:\s]*\$?([\d,]+\.?\d{0,2})/i,
];

const DATE_PATTERNS = [
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
  /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "chipotle", "pizza", "sushi", "diner", "bakery", "bar", "grill", "kitchen", "food", "meal", "lunch", "dinner", "breakfast", "doordash", "grubhub", "ubereats"],
  transport: ["uber", "lyft", "taxi", "cab", "parking", "gas", "fuel", "metro", "transit", "bus", "train", "toll"],
  lodging: ["hotel", "hilton", "marriott", "airbnb", "inn", "motel", "resort", "hyatt", "sheraton"],
  travel: ["airline", "flight", "delta", "united", "american airlines", "southwest", "jetblue", "airport"],
  office: ["amazon", "staples", "office depot", "best buy", "apple", "microsoft", "software", "supplies"],
  entertainment: ["netflix", "spotify", "tickets", "theater", "cinema", "event", "concert", "museum"],
};

function inferCategory(text: string): { category: string; confidence: number } {
  const lowerText = text.toLowerCase();
  let bestCategory = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Longer keywords are more specific and reliable (e.g. "starbucks" > "bar")
        const score = 0.5 + Math.min(keyword.length / 20, 0.45);
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
    }
  }

  return { category: bestCategory, confidence: Math.min(bestScore, 0.95) };
}

function extractAmount(text: string): { amount: number; confidence: number } {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(amount) && amount > 0 && amount < 100000) {
        return { amount, confidence: 0.85 };
      }
    }
  }

  // Fallback: find the largest dollar amount on the page
  const allAmounts = text.match(/\$?\d+\.\d{2}/g);
  if (allAmounts) {
    const amounts = allAmounts
      .map((a) => parseFloat(a.replace("$", "")))
      .filter((a) => a > 0 && a < 100000)
      .sort((a, b) => b - a);
    if (amounts.length > 0) {
      return { amount: amounts[0], confidence: 0.6 };
    }
  }

  return { amount: 0, confidence: 0 };
}

function extractTax(text: string): { taxAmount: number; confidence: number } {
  for (const pattern of TAX_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const taxAmount = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(taxAmount) && taxAmount > 0) {
        return { taxAmount, confidence: 0.8 };
      }
    }
  }
  return { taxAmount: 0, confidence: 0.3 };
}

function extractDate(text: string): { date: string; confidence: number } {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const parsed = new Date(match[0]);
        if (!isNaN(parsed.getTime())) {
          const iso = parsed.toISOString().split("T")[0];
          return { date: iso, confidence: 0.85 };
        }
      } catch {
        // Continue to next pattern
      }
    }
  }
  // Default to today — flagged for user review since confidence is low
  return { date: new Date().toISOString().split("T")[0], confidence: 0.3 };
}

function extractMerchant(text: string): { merchant: string; confidence: number } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Merchant name is usually in the first few non-empty, non-numeric lines
  for (const line of lines.slice(0, 5)) {
    if (line.length < 3) continue;
    if (/^\d+[\.\-\/]/.test(line)) continue;
    if (/^(date|time|total|tax|sub|amount|receipt|order)/i.test(line)) continue;

    const cleaned = line.replace(/[#*\-=]+/g, "").trim();
    if (cleaned.length >= 3 && cleaned.length <= 60) {
      return { merchant: cleaned, confidence: 0.7 };
    }
  }

  return { merchant: "", confidence: 0 };
}

/**
 * Parse raw OCR/extracted text into structured expense data.
 */
export function parseReceiptText(rawText: string): ExtractionResult {
  const flaggedFields: string[] = [];

  const merchantResult = extractMerchant(rawText);
  const amountResult = extractAmount(rawText);
  const taxResult = extractTax(rawText);
  const dateResult = extractDate(rawText);
  const categoryResult = inferCategory(rawText);

  // Flag low-confidence fields for user review
  if (merchantResult.confidence < 0.7) flaggedFields.push("merchant");
  if (amountResult.confidence < 0.7) flaggedFields.push("amount");
  if (dateResult.confidence < 0.7) flaggedFields.push("transactionDate");
  if (categoryResult.confidence < 0.5) flaggedFields.push("category");
  if (taxResult.confidence < 0.5) flaggedFields.push("taxAmount");

  const confidences = [
    merchantResult.confidence,
    amountResult.confidence,
    dateResult.confidence,
    categoryResult.confidence,
  ];
  const overallConfidence =
    confidences.reduce((a, b) => a + b, 0) / confidences.length;

  return {
    merchant: merchantResult.merchant,
    amount: amountResult.amount,
    taxAmount: taxResult.taxAmount,
    transactionDate: dateResult.date,
    currency: "USD",
    category: categoryResult.category,
    description: merchantResult.merchant
      ? `Purchase at ${merchantResult.merchant}`
      : "Receipt expense",
    paymentMethod: "",
    confidence: Math.round(overallConfidence * 100) / 100,
    rawText,
    flaggedFields,
  };
}

/**
 * Extract text and structured data from a receipt file.
 * - Images (.jpg .png .webp): Tesseract.js OCR
 * - PDFs (.pdf): pdf-parse text extraction
 */
export async function extractFromReceipt(
  fileBuffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  let rawText = "";

  if (ext === "pdf") {
    try {
      // pdf-parse is CJS; use require to avoid ESM .default issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
      const result = await pdfParse(fileBuffer);
      rawText = result.text;
    } catch (err) {
      console.error("pdf-parse error:", err);
      rawText = "";
    }
  } else {
    // Image: run Tesseract OCR
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const {
        data: { text },
      } = await Tesseract.recognize(fileBuffer, "eng", {
        logger: () => {}, // suppress verbose progress logs
      });
      rawText = text;
    } catch (err) {
      console.error("Tesseract OCR error:", err);
      rawText = "";
    }
  }

  // If extraction yielded no text, return a low-confidence placeholder
  if (!rawText.trim()) {
    return {
      merchant: "",
      amount: 0,
      taxAmount: 0,
      transactionDate: new Date().toISOString().split("T")[0],
      currency: "USD",
      category: "other",
      description: "Receipt expense",
      paymentMethod: "",
      confidence: 0,
      rawText: "",
      flaggedFields: ["merchant", "amount", "transactionDate", "category"],
    };
  }

  return parseReceiptText(rawText);
}
