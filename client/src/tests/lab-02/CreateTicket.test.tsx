import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateTicket } from "../../components/CreateTicket";

const mockCategories = [{ id: 1, name: "Hardware" }];
const mockSystems = [{ id: 1, name: "Printer System" }];

describe("CreateTicket Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetchDropdowns() {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCategories) });
      }
      if (url.includes("/api/systems")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSystems) });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as any;
  }

  it("should render the form fields", async () => {
    mockFetchDropdowns();
    render(<CreateTicket requesterId={1} requesterName="Alice" />);
    expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("input-summary")).toBeInTheDocument();
    });
    expect(screen.getByTestId("input-description")).toBeInTheDocument();
    expect(screen.getByTestId("select-category")).toBeInTheDocument();
    expect(screen.getByTestId("select-system")).toBeInTheDocument();
    expect(screen.getByTestId("select-priority")).toBeInTheDocument();
    expect(screen.getByTestId("submit-btn")).toBeInTheDocument();
  });

  it("should show validation errors on empty form submission", async () => {
    mockFetchDropdowns();
    render(<CreateTicket requesterId={1} requesterName="Alice" />);

    // Wait for dropdowns to load
    await waitFor(() => expect(screen.getByTestId("select-category")).not.toBeDisabled());

    // Clear selections to force errors
    fireEvent.change(screen.getByTestId("select-priority"), { target: { value: "" } });

    // Clear summary and description
    fireEvent.change(screen.getByTestId("input-summary"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("input-description"), { target: { value: "" } });

    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    });
    expect(screen.getByTestId("error-description")).toBeInTheDocument();
    expect(screen.getByTestId("error-priority")).toBeInTheDocument();
  });

  it("should show description too short error", async () => {
    mockFetchDropdowns();
    render(<CreateTicket requesterId={1} requesterName="Alice" />);

    await waitFor(() => expect(screen.getByTestId("select-category")).not.toBeDisabled());

    fireEvent.change(screen.getByTestId("input-summary"), { target: { value: "My printer broke" } });
    fireEvent.change(screen.getByTestId("input-description"), { target: { value: "Too short" } });
    fireEvent.change(screen.getByTestId("select-priority"), { target: { value: "High" } });
    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("error-description")).toBeInTheDocument();
    });
    expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument();
  });

  it("should show success message on valid submission", async () => {
    mockFetchDropdowns();
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if ((opts?.method === "POST") && url.includes("/api/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ ticketNumber: "TIK-00001", currentStatus: "New" }),
        });
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCategories) });
      }
      if (url.includes("/api/systems")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSystems) });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as any;

    render(<CreateTicket requesterId={1} requesterName="Alice" />);
    await waitFor(() => expect(screen.getByTestId("select-category")).not.toBeDisabled());

    fireEvent.change(screen.getByTestId("input-summary"), { target: { value: "My printer is broken completely" } });
    fireEvent.change(screen.getByTestId("input-description"), { target: { value: "The printer on the 3rd floor has not been working for two days and I need it urgently." } });
    fireEvent.change(screen.getByTestId("select-priority"), { target: { value: "High" } });
    fireEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toBeInTheDocument();
    });
    expect(screen.getByText(/TIK-00001/)).toBeInTheDocument();
  });
});
