import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Login } from "../../components/Login";

// Helper: render Login and trigger mustChangePassword state
async function renderChangePasswordForm() {
  const mockFetch = vi.fn();

  // First call: login — returns mustChangePassword: true
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      token: "temp.token.abc",
      user: { id: 1, fullName: "New User", role: "REQUESTER", mustChangePassword: true },
    }),
  });

  global.fetch = mockFetch;
  const onLoginSuccess = vi.fn();
  render(<Login onLoginSuccess={onLoginSuccess} />);

  // Login using querySelector since inputs have no htmlFor
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
  fireEvent.change(emailInput, { target: { value: "newuser@test.com" } });
  
  // Password input: use type="password" selector
  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
  fireEvent.change(passwordInput, { target: { value: "OldPass1!" } });
  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  await waitFor(() => screen.getByTestId("must-change-password-alert"));
  return { mockFetch, onLoginSuccess };
}

describe("Change Password Form (mandatory first-login)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders change-password form with rules checklist after mustChangePassword login", async () => {
    await renderChangePasswordForm();

    expect(screen.getByTestId("change-password-form")).toBeInTheDocument();
    expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-rules")).toBeInTheDocument();

    // All rules start as failing (red ✗)
    expect(screen.getByTestId("rule-length")).toHaveClass("text-danger");
    expect(screen.getByTestId("rule-upper")).toHaveClass("text-danger");
    expect(screen.getByTestId("rule-lower")).toHaveClass("text-danger");
    expect(screen.getByTestId("rule-number")).toHaveClass("text-danger");
    expect(screen.getByTestId("rule-special")).toHaveClass("text-danger");
  });

  it("updates rules to green as password meets each requirement", async () => {
    await renderChangePasswordForm();

    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "ValidP@ss1" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("rule-length")).toHaveClass("text-success");
      expect(screen.getByTestId("rule-upper")).toHaveClass("text-success");
      expect(screen.getByTestId("rule-lower")).toHaveClass("text-success");
      expect(screen.getByTestId("rule-number")).toHaveClass("text-success");
      expect(screen.getByTestId("rule-special")).toHaveClass("text-success");
    });
  });

  it("shows mismatch indicator when confirm password differs", async () => {
    await renderChangePasswordForm();

    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "ValidP@ss1" },
    });
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "DifferentP@ss2" },
    });

    expect(screen.getByTestId("match-indicator")).toHaveClass("text-danger");
    expect(screen.getByTestId("match-indicator")).toHaveTextContent("do not match");
  });

  it("submit button is disabled until rules pass and passwords match", async () => {
    await renderChangePasswordForm();

    const submitBtn = screen.getByTestId("change-password-submit");
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "ValidP@ss1" },
    });
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "ValidP@ss1" },
    });

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
  });

  it("shows client-side error when rules not met and form submitted", async () => {
    await renderChangePasswordForm();

    fireEvent.change(screen.getByTestId("new-password-input"), { target: { value: "weak" } });
    fireEvent.change(screen.getByTestId("confirm-password-input"), { target: { value: "weak" } });
    // Submit directly via form (bypasses disabled button)
    fireEvent.submit(screen.getByTestId("change-password-form"));

    await waitFor(() => {
      expect(screen.getByTestId("change-password-error")).toHaveTextContent("requirements");
    });
  });

  it("calls onLoginSuccess after successful password change", async () => {
    const { mockFetch, onLoginSuccess } = await renderChangePasswordForm();

    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: "Password updated successfully" }) });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, fullName: "New User", role: "REQUESTER", mustChangePassword: false }),
    });

    fireEvent.change(screen.getByTestId("new-password-input"), { target: { value: "ValidP@ss1" } });
    fireEvent.change(screen.getByTestId("confirm-password-input"), { target: { value: "ValidP@ss1" } });

    await waitFor(() => expect(screen.getByTestId("change-password-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("change-password-submit"));

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledTimes(1));
  });

  it("shows server error if API returns an error", async () => {
    const { mockFetch } = await renderChangePasswordForm();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Token expired" }),
    });

    fireEvent.change(screen.getByTestId("new-password-input"), { target: { value: "ValidP@ss1" } });
    fireEvent.change(screen.getByTestId("confirm-password-input"), { target: { value: "ValidP@ss1" } });
    await waitFor(() => expect(screen.getByTestId("change-password-submit")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("change-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("change-password-error")).toHaveTextContent("Token expired");
    });
  });
});
