import { useEffect, useState } from "react";

interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export function DevelopmentRequesterSelection() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/requesters")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch requesters");
        return res.json();
      })
      .then((data) => {
        setRequesters(data);
        if (data.length > 0) setSelectedId(data[0].id.toString());
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleContinue = () => {
    if (selectedId) {
      localStorage.setItem("dev_requester_id", selectedId);
      setSaved(true);
      // In a real app, you might redirect here.
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm" style={{ borderTop: "4px solid #006B3C" }}>
        <div className="card-body">
          <h2 className="card-title text-center" style={{ color: "#006B3C" }}>TokTickIT</h2>
          <p className="text-muted text-center mb-4">
            Mock Login (Lab 2 Development) - Select a requester to simulate an active session.
          </p>

          {loading && (
            <div className="text-center my-4" data-testid="loading-spinner">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert" data-testid="error-message">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div data-testid="success-state">
              <div className="mb-3">
                <label htmlFor="requesterSelect" className="form-label">
                  Select Active Requester
                </label>
                <select
                  id="requesterSelect"
                  className="form-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  data-testid="requester-dropdown"
                >
                  {requesters.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.name} ({req.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-primary"
                  style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                  onClick={handleContinue}
                  data-testid="continue-btn"
                >
                  Continue
                </button>
              </div>

              {saved && (
                <div className="alert alert-success mt-3" role="alert" data-testid="saved-message">
                  Session saved! Requester ID: {selectedId}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

