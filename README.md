# 💸 Reimbursement Management

> A full-stack enterprise expense reimbursement platform with multi-step approval workflows, OCR receipt scanning, and role-based access control — built with Next.js 15 and Prisma.

---

## ✨ Features

- **Multi-Step Approval Engine** — Configurable sequential approval chain (Manager → Finance → Director) with CFO override for instant approval at any step
- **OCR Receipt Scanning** — Upload a receipt image and auto-extract merchant name, amount, and date using Tesseract.js (fully client-side, no external API needed)
- **Role-Based Access Control** — Six roles (`EMPLOYEE`, `MANAGER`, `FINANCE`, `DIRECTOR`, `ADMIN`, `CFO`) with route-level enforcement
- **Clerk Authentication** — Secure sign-in/sign-up with organization support and webhook-based user sync
- **Expense Lifecycle Tracking** — Real-time status (`DRAFT → PENDING → APPROVED / REJECTED`) with step-by-step approval progress visualization
- **Admin Panel** — Manage approval rules, configure SLA days per step, and set threshold percentages
- **Line-Item Expenses** — Break down each expense into multiple line items for granular tracking
- **Multi-Currency Support** — Submit expenses in any currency (USD, INR, etc.)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Auth | Clerk (with webhook sync) |
| ORM | Prisma |
| Database | PostgreSQL |
| State | Zustand + TanStack React Query |
| Tables | TanStack React Table |
| OCR | Tesseract.js (client-side) |

---

## 🗂 Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Sign-in & sign-up pages (Clerk)
│   ├── (dashboard)/
│   │   ├── dashboard/           # Home — stats + recent expenses
│   │   ├── expenses/
│   │   │   ├── new/             # Submit a new expense (with OCR)
│   │   │   └── [id]/            # Expense detail + approval progress
│   │   ├── approvals/           # Approver queue
│   │   └── admin/               # Approval rule configuration
│   └── api/
│       ├── expenses/            # CRUD + approve/reject endpoints
│       ├── approval-rules/      # Rule management
│       ├── users/me/            # Current user info
│       └── webhooks/clerk/      # User sync on sign-up
├── components/
│   ├── expenses/                # ApprovalProgress, ReceiptUploader, StatusBadge
│   ├── layout/                  # Sidebar navigation
│   └── ui/                      # Button, Card, Dialog, Select, etc.
├── hooks/
│   └── use-ocr.ts               # Tesseract.js OCR hook
└── lib/
    ├── approval-engine.ts        # Core approval/rejection logic
    ├── auth.ts                   # Clerk helpers
    ├── db-helpers.ts             # Prisma utilities
    └── errors.ts                 # ApiError class
prisma/
├── schema.prisma                 # DB models
└── seed.ts                       # Demo data (Acme Corp)
```

---

## 🔄 Workflow

```
Employee submits expense
        │
        ▼
   [Step 0] MANAGER reviews
        │ approved
        ▼
   [Step 1] FINANCE reviews
        │ approved
        ▼
   [Step 2] DIRECTOR reviews
        │ approved
        ▼
      ✅ APPROVED

  At any step: CFO can override → instant APPROVED
  At any step: Any approver can REJECT → expense closed
```

Approval rules are fully configurable per organization — set the number of steps, the required role for each step, and the SLA (days) in the Admin panel.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- A [Clerk](https://clerk.com) account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/reimbursement-management.git
cd reimbursement-management
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reimbursement"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Set Up the Database

```bash
# Push the schema to your database
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

### 4. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 📜 Database Schema (Key Models)

```
Organization  ──< User
                   │
              ──< Expense ──< ExpenseLineItem
                   │
              ──< ApprovalRecord

Organization  ──< ApprovalRule ──< ApprovalStep
```

Expenses track a `currentStep` integer that advances through the configured `ApprovalStep` sequence. Each action is recorded as an `ApprovalRecord` for a full audit trail.

---

## 🧠 OCR — How It Works

1. User uploads a receipt image on the new expense form
2. `useOcr()` hook dynamically loads Tesseract.js (avoiding SSR issues)
3. The worker recognizes English text and reports progress in real-time
4. A heuristic parser extracts: the **largest dollar amount**, the **first valid date**, and the **first meaningful non-header line** as the merchant name
5. Fields are pre-filled into the expense form — user can review and correct before submitting

No server calls, no third-party OCR API — everything runs in the browser.

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run db:push      # Push schema to database (no migration file)
npm run db:migrate   # Create and apply a migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

---

## 📄 License

MIT
