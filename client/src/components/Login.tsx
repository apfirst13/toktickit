import { useState } from "react";

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
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
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

      // Password changed successfully, we can now complete login by fetching /me or trusting the payload
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
    setError(null);
  };

  if (mustChangePassword) {
    return (
      <div className="container mt-5" style={{ maxWidth: "400px" }}>
        <div className="card shadow-sm border-0" data-testid="must-change-password-alert">
          <div className="card-header bg-warning text-dark border-0 py-3">
            <h5 className="mb-0">Security Alert</h5>
          </div>
          <div className="card-body p-4">
            <p className="text-muted mb-4">You must change your temporary password before continuing.</p>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label text-muted fw-semibold">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={handleLogout}>Logout</button>
                <button type="submit" className="btn btn-success">Change Password</button>
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
              <label className="form-label text-muted fw-semibold">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label text-muted fw-semibold">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100 py-2 fw-bold">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
