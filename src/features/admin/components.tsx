"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AdminActionState } from "@/features/admin/actions";

const initialState: AdminActionState = { message: "", ok: false };

export function AdminNotice({
  mode,
}: {
  mode: { enabled: boolean; label: string; reason: string };
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase text-warning">
            Demonstration administration environment.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{mode.reason}</p>
        </div>
        <StatusBadge tone={mode.enabled ? "warning" : "info"}>
          {mode.label}
        </StatusBadge>
      </div>
    </Panel>
  );
}

export function AdminActionForm({
  action,
  children,
  confirmMessage,
  submitLabel,
}: {
  action: (
    state: AdminActionState,
    formData: FormData,
  ) => Promise<AdminActionState>;
  children: ReactNode;
  confirmMessage?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
      {state.message ? (
        <p
          className={`rounded-sm border px-3 py-2 text-sm ${
            state.ok
              ? "border-positive/40 bg-positive/10 text-positive"
              : "border-negative/40 bg-negative/10 text-negative"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Working..." : submitLabel}
      </Button>
    </form>
  );
}

export function AdminField({
  children,
  error,
  hint,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
}) {
  return (
    <label className="grid gap-1 text-sm text-foreground">
      <span className="font-mono text-xs uppercase text-subtle">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs leading-5 text-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="text-xs leading-5 text-negative">{error}</span>
      ) : null}
    </label>
  );
}

export function AdminCheckboxGroup({
  children,
  legend,
}: {
  children: ReactNode;
  legend: string;
}) {
  return (
    <fieldset className="rounded-sm border border-border bg-background-elevated p-3">
      <legend className="px-1 font-mono text-xs uppercase text-subtle">
        {legend}
      </legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export function AdminCheckbox({
  defaultChecked,
  label,
  name,
  value,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-muted">
      <input
        className="size-4 accent-[rgb(var(--color-accent))]"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value={value}
      />
      {label}
    </label>
  );
}
