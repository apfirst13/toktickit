import { useState } from "react";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

function checkPasswordRules(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      
      if (data.user.mustChangePassword) {
        setMustChangePassword(true);
        setTempToken(data.token);
      } else {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rules = checkPasswordRules(newPassword);
    if (!Object.values(rules).every(Boolean)) {
      setError("Password does not meet all requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tempToken}`
        },
        body: JSON.stringify({ newPassword })
      });
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to change password");
        return;
      }

      // Password changed successfully — fetch fresh user data and continue into app
      const meRes = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${tempToken}` }
      });
      const meData = await meRes.json();
      onLoginSuccess(tempToken!, meData);
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleLogout = () => {
    setMustChangePassword(false);
    setTempToken(null);
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  if (mustChangePassword) {
    const rules = checkPasswordRules(newPassword);
    const allRulesMet = Object.values(rules).every(Boolean);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

    return (
      <div className="container mt-5" style={{ maxWidth: "440px" }}>
        <div className="card shadow-sm border-0" data-testid="must-change-password-alert">
          <div className="card-header bg-warning text-dark border-0 py-3">
            <h5 className="mb-0">🔐 Security Alert — Password Change Required</h5>
          </div>
          <div className="card-body p-4">
            <p className="text-muted mb-3">You must set a new password before accessing the system.</p>
            {error && <div className="alert alert-danger py-2" data-testid="change-password-error">{error}</div>}
            <form onSubmit={handleChangePassword} data-testid="change-password-form">
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label fw-semibold">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="new-password-input"
                  required
                />
              </div>

              {/* Real-time password rules checklist */}
              <div className="mb-3 p-3 rounded" style={{ background: "#f8f9fa", fontSize: "0.85rem" }} data-testid="password-rules">
                <div className="fw-semibold mb-2">Password must contain:</div>
                {[
                  { key: "length",  label: "At least 8 characters" },
                  { key: "upper",   label: "One uppercase letter (A–Z)" },
                  { key: "lower",   label: "One lowercase letter (a–z)" },
                  { key: "number",  label: "One number (0–9)" },
                  { key: "special", label: "One special character (!@#…)" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className={rules[key as keyof typeof rules] ? "text-success" : "text-danger"}
                    data-testid={`rule-${key}`}
                  >
                    {rules[key as keyof typeof rules] ? "✓" : "✗"} {label}
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label fw-semibold">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="confirm-password-input"
                  required
                />
                {confirmPassword.length > 0 && (
                  <div
                    className={`form-text ${passwordsMatch ? "text-success" : "text-danger"}`}
                    data-testid="match-indicator"
                  >
                    {passwordsMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-outline-secondary" onClick={handleLogout}>
                  Logout
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={!allRulesMet || !passwordsMatch}
                  data-testid="change-password-submit"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="text-center mb-4">
        <h2 style={{ color: "#006B3C" }}>TokTickIT</h2>
        <p className="text-muted">Authentication Required</p>
      </div>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-muted fw-semibold">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="form-label text-muted fw-semibold">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100 py-2 fw-bold" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
