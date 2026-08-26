import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DevelopmentRequesterSelection } from "../../components/DevelopmentRequesterSelection";

const mockRequesters = [
  { id: 1, name: "Alice", email: "alice@example.com", isActive: true },
  { id: 2, name: "Bob", email: "bob@example.com", isActive: true },
];

describe("DevelopmentRequesterSelection Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should display loading spinner initially", () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // Never resolves
    render(<DevelopmentRequesterSelection />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("should display error message on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));
    render(<DevelopmentRequesterSelection />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
    expect(screen.getByText("Network Error")).toBeInTheDocument();
  });

  it("should render dropdown on success and save to localStorage on continue", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequesters),
    });

    render(<DevelopmentRequesterSelection />);

    // Wait for dropdown
    await waitFor(() => {
      expect(screen.getByTestId("requester-dropdown")).toBeInTheDocument();
    });

    // Check if options are rendered
    expect(screen.getByText("Alice (alice@example.com)")).toBeInTheDocument();
    expect(screen.getByText("Bob (bob@example.com)")).toBeInTheDocument();

    // Select second option
    const select = screen.getByTestId("requester-dropdown");
    fireEvent.change(select, { target: { value: "2" } });

    // Click continue
    const continueBtn = screen.getByTestId("continue-btn");
    fireEvent.click(continueBtn);

    // Verify localStorage
    expect(localStorage.getItem("dev_requester_id")).toBe("2");
    
    // Verify success message
    expect(screen.getByTestId("saved-message")).toBeInTheDocument();
  });
});

