import React, { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/layout/header";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { truncateWallet, WalletDisplay } from "@/components/ui/wallet-display";

const navigationMock = vi.hoisted(() => ({
  pathname: "/competitions",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMock.pathname,
}));

describe("header navigation", () => {
  it("marks the active desktop route with aria-current", () => {
    navigationMock.pathname = "/competitions";

    render(<Header />);

    expect(
      screen.getAllByRole("link", { name: "Competitions" })[0],
    ).toHaveAttribute("aria-current", "page");
  });

  it("opens mobile navigation from the menu button", () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: "Menu" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Mobile navigation")).toBeInTheDocument();
  });
});

describe("wallet display", () => {
  it("truncates long wallet identifiers", () => {
    expect(
      truncateWallet("PArenaSyntheticWallet1111111111111111111111111111"),
    ).toBe("PArena...111111");
  });

  it("copies the full wallet value when clipboard support exists", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <WalletDisplay wallet="PArenaSyntheticWallet1111111111111111111111111111" />,
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copy wallet address" }),
      );
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();

    expect(writeText).toHaveBeenCalledWith(
      "PArenaSyntheticWallet1111111111111111111111111111",
    );
  });
});

describe("status and disclaimer surfaces", () => {
  it("renders distinct status badge variants", () => {
    render(
      <div>
        <StatusBadge tone="positive">Positive</StatusBadge>
        <StatusBadge tone="negative">Negative</StatusBadge>
        <StatusBadge tone="warning">Warning</StatusBadge>
        <StatusBadge tone="info">Info</StatusBadge>
      </div>,
    );

    expect(screen.getByText("Positive")).toHaveClass("text-positive");
    expect(screen.getByText("Negative")).toHaveClass("text-negative");
    expect(screen.getByText("Warning")).toHaveClass("text-warning");
    expect(screen.getByText("Info")).toHaveClass("text-info");
  });

  it("keeps the simulated-only disclaimer visible", () => {
    render(<DisclaimerBanner />);

    expect(screen.getByText(/does not execute trades/i)).toBeVisible();
    expect(
      screen.getByText(/synthetic unless explicitly stated otherwise/i),
    ).toBeVisible();
  });
});
