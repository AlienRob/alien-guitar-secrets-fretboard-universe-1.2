import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";

// CheckoutReturn reads the player's premium status through a generated React
// Query hook and the query client. We mock both so the component renders
// deterministically without a network layer or a QueryClientProvider.
const summaryRef = { current: { isPremium: false } as { isPremium: boolean } };
const { invalidateQueries, toast } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@workspace/api-client-react", () => ({
  useGetProfileSummary: () => ({ data: summaryRef.current }),
  getGetProfileSummaryQueryKey: () => ["profile-summary"],
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("@/hooks/use-toast", () => ({ toast }));

import CheckoutReturn from "./checkout-return";

function setUrl(url: string) {
  window.history.replaceState({}, "", url);
}

describe("CheckoutReturn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    summaryRef.current = { isPremium: false };
    invalidateQueries.mockClear();
    toast.mockClear();
    setUrl("/galaxy");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing without a checkout param", () => {
    render(<CheckoutReturn />);
    expect(toast).not.toHaveBeenCalled();
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("confirms a cancelled checkout and strips the param, keeping others", () => {
    setUrl("/pricing?checkout=cancelled&plan=yearly");
    render(<CheckoutReturn />);
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0][0].title).toMatch(/cancelled/i);
    expect(invalidateQueries).not.toHaveBeenCalled();
    expect(window.location.pathname + window.location.search).toBe(
      "/pricing?plan=yearly",
    );
  });

  it("refetches premium status and celebrates once recognised", () => {
    setUrl("/galaxy?checkout=success");
    const { rerender } = render(<CheckoutReturn />);

    // Immediately invalidates so the rest of the app refetches, and strips
    // the return param from the URL.
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["profile-summary"],
    });
    expect(window.location.pathname + window.location.search).toBe("/galaxy");

    // Webhook lands -> summary now reports premium -> celebratory toast.
    summaryRef.current = { isPremium: true };
    act(() => {
      rerender(<CheckoutReturn />);
    });
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0][0].title).toMatch(/welcome to premium/i);
  });

  it("falls back gracefully if premium never arrives", () => {
    setUrl("/galaxy?checkout=success");
    render(<CheckoutReturn />);
    toast.mockClear();

    // Exhaust the polling window (8 tries * 2s).
    act(() => {
      vi.advanceTimersByTime(2000 * 8);
    });

    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0][0].title).toMatch(/payment received/i);
  });
});
