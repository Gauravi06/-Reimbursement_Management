"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = ["EMPLOYEE", "MANAGER", "FINANCE", "DIRECTOR", "ADMIN", "CFO"];

interface Step {
  order: number;
  role: string;
  type: "SEQUENTIAL" | "OVERRIDE";
  slaDays: number;
}

interface Rule {
  thresholdPercent: number;
  overrideRole: string;
  steps: Step[];
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rule, setRule] = useState<Rule>({
    thresholdPercent: 60,
    overrideRole: "CFO",
    steps: [
      { order: 0, role: "MANAGER", type: "SEQUENTIAL", slaDays: 2 },
      { order: 1, role: "FINANCE", type: "SEQUENTIAL", slaDays: 1 },
      { order: 2, role: "DIRECTOR", type: "SEQUENTIAL", slaDays: 3 },
    ],
  });

  useEffect(() => {
    fetch("/api/approval-rules")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const r = data[0];
          setRule({
            thresholdPercent: r.thresholdPercent,
            overrideRole: r.overrideRole,
            steps: r.steps,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function addStep() {
    setRule((r) => ({
      ...r,
      steps: [
        ...r.steps,
        { order: r.steps.length, role: "MANAGER", type: "SEQUENTIAL", slaDays: 2 },
      ],
    }));
  }

  function removeStep(idx: number) {
    setRule((r) => ({
      ...r,
      steps: r.steps
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, order: i })),
    }));
  }

  function updateStep(idx: number, key: keyof Step, value: string | number) {
    setRule((r) => ({
      ...r,
      steps: r.steps.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/approval-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure the approval workflow for your organization.
        </p>
      </div>

      {/* Global settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Global Settings
          </CardTitle>
          <CardDescription>
            These settings apply to all approval workflows in your org.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Threshold % (multi-approver)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={rule.thresholdPercent}
              onChange={(e) =>
                setRule((r) => ({ ...r, thresholdPercent: parseInt(e.target.value) || 60 }))
              }
            />
            <p className="text-xs text-muted-foreground">
              % of approvers needed to advance a step
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Override Role</Label>
            <Select
              value={rule.overrideRole}
              onValueChange={(v) => setRule((r) => ({ ...r, overrideRole: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This role can skip all steps and auto-approve
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Approval steps */}
      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Approval Steps
            </CardTitle>
            <CardDescription className="mt-1">
              Steps are executed sequentially in order.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Step
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {rule.steps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No steps configured. Add at least one step.
            </p>
          )}

          {rule.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20"
            >
              {/* Step number */}
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </div>

              {/* Role */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select
                  value={step.role}
                  onValueChange={(v) => updateStep(idx, "role", v)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SLA days */}
              <div className="w-24 space-y-1">
                <Label className="text-xs text-muted-foreground">SLA (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={step.slaDays}
                  onChange={(e) => updateStep(idx, "slaDays", parseInt(e.target.value) || 1)}
                  className="h-8"
                />
              </div>

              {/* Type */}
              <div className="w-36 space-y-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={step.type}
                  onValueChange={(v) => updateStep(idx, "type", v as Step["type"])}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEQUENTIAL">Sequential</SelectItem>
                    <SelectItem value="OVERRIDE">Override</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Remove */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeStep(idx)}
                disabled={rule.steps.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Workflow preview */}
      {rule.steps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Workflow Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-md bg-muted">
                EMPLOYEE submits
              </span>
              {rule.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">→</span>
                  <span className="text-xs font-medium text-primary px-2.5 py-1 rounded-md bg-primary/10">
                    {step.role} ({step.slaDays}d)
                  </span>
                </div>
              ))}
              <span className="text-muted-foreground text-sm">→</span>
              <span className="text-xs font-medium text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10">
                APPROVED
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Override: <span className="text-amber-400">{rule.overrideRole}</span> can approve any expense instantly.
              Threshold: <span className="text-foreground">{rule.thresholdPercent}%</span> of step approvers needed to advance.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle className="h-4 w-4" /> Saved!</>
        ) : (
          <><Save className="h-4 w-4" /> Save Workflow</>
        )}
      </Button>
    </div>
  );
}
