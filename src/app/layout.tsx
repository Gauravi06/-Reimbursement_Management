import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReimburseAI — Expense Management",
  description: "Autonomous multi-step expense reimbursement platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
