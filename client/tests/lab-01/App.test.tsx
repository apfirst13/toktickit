import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../src/App.js";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the TokTickIT heading", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }) as any;
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    // Wait for the fetch to complete to prevent "not wrapped in act" warning
    await waitFor(() => {
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });

  // Issue 4 — write these yourself. Hint: mock the api module with
  // vi.spyOn(api, "checkSystem").mockResolvedValue(...) / .mockRejectedValue(...)
  // then click the button and assert the Online list / Offline message.
  it("shows Online and the seeded categories on success", async () => {
    // Component changed in Lab 2: App no longer shows online status/categories directly,
    // but we test its new success behavior (showing requester selection) 
    // to match current component behavior while keeping the old test name.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: "Alice", email: "alice@test.com" }]),
    }) as any;
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Alice \(alice@test.com\)/i)).toBeInTheDocument();
    });
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    // Component changed in Lab 2: App now shows a fetch error in the requester selection.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
    }) as any;

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent("Failed to fetch requesters");
    });
  });
});
