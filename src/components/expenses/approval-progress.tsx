"use client";

import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  order: number;
  role: string;
  slaDays: number;
}

interface ApprovalRecord {
  stepOrder: number;
  action: string;
  approver: { firstName: string; lastName: string; role: string };
  createdAt: string;
  note?: string | null;
}

interface ApprovalProgressProps {
  steps: Step[];
  records: ApprovalRecord[];
  currentStep: number;
  status: string;
}

export function ApprovalProgress({ steps, records, currentStep, status }: ApprovalProgressProps) {
  function getStepState(step: Step) {
    const record = records.find((r) => r.stepOrder === step.order);
    if (record?.action === "rejected") return "rejected";
    if (record?.action === "approved") return "approved";
    if (step.order === currentStep && status === "PENDING") return "active";
    return "waiting";
  }

  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const state = getStepState(step);
        const record = records.find((r) => r.stepOrder === step.order);
        const isLast = i === steps.length - 1;

        return (
          <div key={step.order} className="flex items-start flex-1">
            {/* Step circle + connector */}
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Connector left */}
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      state === "approved" ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                )}

                {/* Circle */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    state === "approved" && "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                    state === "rejected" && "border-red-500 bg-red-500/10 text-red-400",
                    state === "active" && "border-blue-500 bg-blue-500/10 text-blue-400 animate-pulse",
                    state === "waiting" && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {state === "approved" && <Check className="h-4 w-4" />}
                  {state === "rejected" && <X className="h-4 w-4" />}
                  {state === "active" && <Clock className="h-4 w-4" />}
                  {state === "waiting" && <span>{i + 1}</span>}
                </div>

                {/* Connector right */}
                {!isLast && (
                  <div
                    className={cn(
                      "h-0.5 flex-1",
                      state === "approved" ? "bg-emerald-500" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Label below */}
              <div className="mt-2 text-center px-1">
                <p
                  className={cn(
                    "text-xs font-medium",
                    state === "approved" && "text-emerald-400",
                    state === "rejected" && "text-red-400",
                    state === "active" && "text-blue-400",
                    state === "waiting" && "text-muted-foreground"
                  )}
                >
                  {step.role}
                </p>
                {record && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {record.approver.firstName} {record.approver.lastName}
                  </p>
                )}
                {state === "active" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SLA: {step.slaDays}d
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
