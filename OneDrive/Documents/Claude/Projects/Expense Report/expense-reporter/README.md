# ExpenseBot — Smart Expense Reporting Tool

A modern, agentic expense reporting application that makes expense management effortless. Upload receipts, let AI extract the details, organize expenses into reports, and submit for reimbursement — all in minutes.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment
cp .env.example .env
# Edit .env with your settings (defaults work for local dev)

# 3. Initialize the database and seed demo data
npm run setup

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a demo account:

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Employee | jane@acmecorp.com   | employee123  |
| Admin    | admin@acmecorp.com  | admin123     |

## Architecture

```
expense-reporter/
├── prisma/
│   ├── schema.prisma        # Database schema (SQLite)
│   └── seed.ts              # Demo data seeder
├── public/uploads/           # Uploaded receipt files
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # API routes (auth, suggestions, duplicates)
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── login/            # Authentication page
│   │   ├── receipts/         # Expense management page
│   │   └── reports/          # Report assembly & submission
│   │       └── [id]/         # Individual report detail
│   ├── components/
│   │   ├── layout/           # Navbar, Providers
│   │   ├── receipts/         # ReceiptUploader, ExpenseForm
│   │   ├── suggestions/      # SuggestionCards
│   │   └── ui/               # Button, Input, Card (reusable primitives)
│   ├── lib/
│   │   ├── actions.ts        # Server Actions (all backend logic)
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── email.ts          # Email service (Nodemailer)
│   │   ├── extraction.ts     # OCR/extraction service (abstracted)
│   │   ├── suggestions.ts    # Trend-based suggestion engine
│   │   └── utils.ts          # Shared utilities
│   └── types/
│       └── next-auth.d.ts    # TypeScript augmentation for auth types
├── .env.example              # Environment variable template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Core Flows

### 1. Receipt Upload & Extraction
User uploads an image/PDF → file is saved to disk → OCR extraction runs → structured data is extracted (merchant, amount, date, tax, category) → expense record is created in draft state → user reviews extracted fields → flagged low-confidence fields are highlighted for review.

### 2. Expense Report Assembly
User creates a new report → fills in metadata (title, purpose, date range, department) → attaches expenses from their unattached pool OR uploads new receipts directly → adds manual expenses as needed → report total is auto-calculated.

### 3. Submission Workflow
User reviews the complete report summary → confirms submission → system sends a professional HTML email to the admin with itemized expenses, totals, and employee info → report status is updated to "submitted" → user sees confirmation.

### 4. Trend-Based Suggestions
System analyzes the user's historical expenses → identifies frequently used merchants, recurring categories, and repeated expense patterns → surfaces suggestion cards on the dashboard → user can one-click add or prefill a new expense from suggestions.

## Technology Choices

| Layer        | Choice          | Rationale                                           |
|-------------|-----------------|-----------------------------------------------------|
| Framework   | Next.js 14      | Full-stack React with App Router, Server Actions    |
| Language    | TypeScript      | Type safety across frontend and backend             |
| Database    | SQLite + Prisma | Zero-config local dev, easy swap to Postgres        |
| Auth        | NextAuth.js     | Simple credential auth, extensible to SSO/OAuth     |
| Styling     | Tailwind CSS    | Rapid, consistent UI development                    |
| Email       | Nodemailer      | SMTP-based, works with any email provider           |
| OCR         | Abstracted      | Tesseract.js simulation now, swap to cloud later    |
| File Upload | react-dropzone  | Polished drag-and-drop UX                           |

## Data Model

### Expense
Merchant, amount, currency, tax, date, category, payment method, description, receipt file, extraction confidence, flagged fields, reimbursable/billable flags, project/client, status (draft → reviewed → submitted).

### ExpenseReport
Title, department, date range, business purpose, project/client, notes, list of expenses, total amount, status (draft → submitted → approved/rejected), submission timestamp.

## Agentic Behaviors

The app includes several intelligent behaviors that reduce manual work:

1. **Auto-extraction**: After receipt upload, fields are automatically populated
2. **Confidence scoring**: Each extracted field has a confidence level; low-confidence fields are flagged
3. **Category inference**: Merchant names are mapped to likely expense categories
4. **Duplicate detection**: API endpoint checks for matching merchant + amount + date
5. **Trend suggestions**: Dashboard shows frequently used merchants and categories for quick-add
6. **Smart defaults**: New reports prefill department and date from user profile

## Email Configuration

Without SMTP credentials, emails are logged to the console (perfect for development). To enable real email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="ExpenseBot <noreply@company.com>"
ADMIN_EMAIL=admin@company.com
```

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833).

## OCR / Extraction

The extraction service (`src/lib/extraction.ts`) is designed as a swappable abstraction. The current implementation simulates extraction based on filename heuristics for the MVP demo. The `parseReceiptText()` function contains real parsing logic for actual OCR output.

To swap in a production OCR provider, update the `extractFromReceipt()` function to call:
- Google Cloud Vision API
- AWS Textract
- Azure Form Recognizer
- Tesseract.js (local, free)

Set `OCR_PROVIDER` in `.env` to configure.

## Future Improvements

- **Real OCR integration** with Tesseract.js worker or cloud API
- **Admin review dashboard** for approving/rejecting reports
- **PDF export** of submitted reports
- **Expense policy engine** with configurable rules and warnings
- **Multi-currency support** with automatic conversion
- **Bulk receipt upload** with batch processing
- **Mobile camera capture** for on-the-go receipt scanning
- **Approval workflow** with multi-level approval chains
- **SSO/SAML authentication** for enterprise deployment
- **Audit trail** logging all changes to expenses and reports
- **Receipt image enhancement** (rotation, crop, contrast)
- **Mileage tracking** with map integration
- **Per diem calculations** based on travel destination
- **Integration APIs** for accounting software (QuickBooks, Xero, etc.)

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run setup      # Initialize DB + seed data (first-time setup)
npm run db:push    # Apply schema changes
npm run db:seed    # Re-seed demo data
npm run db:reset   # Full reset: drop + recreate + seed
npm run db:studio  # Open Prisma Studio (visual DB browser)
```
