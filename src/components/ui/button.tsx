import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  className?: string;
  href?: never;
  variant?: ButtonVariant;
};

type LinkButtonProps = {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: ButtonVariant;
};

export function Button(props: ButtonProps | LinkButtonProps) {
  const variant = props.variant ?? "primary";
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "border-accent bg-accent text-background hover:border-accent hover:bg-accent/85",
    secondary:
      "border-border bg-surface-raised text-foreground hover:border-border-strong hover:bg-surface",
    ghost:
      "border-transparent bg-transparent text-muted hover:border-border hover:bg-surface hover:text-foreground",
    danger: "border-negative bg-negative/15 text-negative hover:bg-negative/25",
  };
  const className = [
    "inline-flex min-h-10 items-center justify-center rounded-sm border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
    variantClasses[variant],
    props.className,
  ]
    .filter(Boolean)
    .join(" ");

  if (typeof props.href === "string") {
    return (
      <Link className={className} href={props.href}>
        {props.children}
      </Link>
    );
  }

  const {
    children,
    className: ignoredClassName,
    variant: ignoredVariant,
    ...buttonProps
  } = props;
  void ignoredClassName;
  void ignoredVariant;

  return (
    <button className={className} {...buttonProps}>
      {children}
    </button>
  );
}
