import { useState, useEffect } from "react";

interface HealthCheckResponse {
  status: "ok" | "error";
  service?: string;
  message?: string;
}

export const HealthStatus = () => {
  const [status, setStatus] = useState<"ok" | "offline" | "loading">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setStatus("loading");
        const res = await fetch("/api/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data: HealthCheckResponse = await res.json();
          if (data.status === "ok") {
            setStatus("ok");
            setErrorMessage("");
          } else {
            setStatus("offline");
            setErrorMessage(data.message || "Backend returned an error");
          }
        } else {
          setStatus("offline");
          setErrorMessage(`HTTP ${res.status}: Failed to connect`);
        }
      } catch (error) {
        setStatus("offline");
        setErrorMessage(
          error instanceof Error ? error.message : "Connection error"
        );
      }
    };

    // Check health on mount
    checkHealth();

    // Optionally check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "10px", margin: "10px 0" }}>
      {status === "ok" && (
        <div style={{ color: "green", fontWeight: "bold" }}>
          ✅ Backend Connected
        </div>
      )}
      {status === "offline" && (
        <div style={{ color: "red", fontWeight: "bold" }}>
          ❌ Backend Offline
          {errorMessage && <p style={{ fontSize: "12px" }}>{errorMessage}</p>}
        </div>
      )}
      {status === "loading" && (
        <div style={{ color: "gray" }}>⏳ Checking connection...</div>
      )}
    </div>
  );
};

export default HealthStatus;
