"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type WalletDisplayProps = {
  wallet: string;
};

export function truncateWallet(wallet: string) {
  if (wallet.length <= 14) {
    return wallet;
  }

  return `${wallet.slice(0, 6)}...${wallet.slice(-6)}`;
}

export function WalletDisplay({ wallet }: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function copyWallet() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(wallet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-sm border border-border bg-background-elevated px-2 py-1">
      <span
        className="min-w-0 truncate font-mono text-sm text-foreground"
        title={wallet}
      >
        {truncateWallet(wallet)}
      </span>
      <Button
        aria-label="Copy wallet address"
        className="min-h-7 px-2 py-1 text-xs"
        onClick={copyWallet}
        type="button"
        variant="ghost"
      >
        {copied ? "Copied" : "Copy"}
      </Button>
    </span>
  );
}
