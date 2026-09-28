import { useEffect, useState } from "react";

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category: { name: string };
  assignedStaff: { fullName: string } | null;
}

interface DashboardData {
  metrics: {
    myOpen: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  recentlyUpdated: Ticket[];
}

interface RequesterDashboardProps {
  onNavigateToList: (statuses: string) => void;
  onViewTicket: (id: number) => void;
  onCreateTicket: () => void;
}

export function RequesterDashboard({ onNavigateToList, onViewTicket, onCreateTicket }: RequesterDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/requester", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5" data-testid="dashboard-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.metrics || !data.recentlyUpdated) {
    return <div className="alert alert-danger">Error loading dashboard: {error || 'Invalid data format'}</div>;
  }

  const { metrics, recentlyUpdated } = data;

  const MetricCard = ({ title, count, statuses, color }: { title: string, count: number, statuses: string, color: string }) => (
    <div className="col-sm-6 col-md-3 mb-3">
      <div 
        className={`card text-white bg-${color} h-100`} 
        style={{ cursor: "pointer", transition: "transform 0.2s" }}
        onClick={() => onNavigateToList(statuses)}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        data-testid={`metric-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="card-body text-center">
          <h5 className="card-title">{title}</h5>
          <h2 className="display-4 fw-bold mb-0">{count}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" data-testid="requester-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Dashboard</h4>
        <button className="btn btn-primary" onClick={onCreateTicket} style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}>
          + New Ticket
        </button>
      </div>

      <div className="row mb-4">
        <MetricCard title="My Open" count={metrics.myOpen} statuses="NEW,OPEN" color="primary" />
        <MetricCard title="In Progress" count={metrics.inProgress} statuses="IN_PROGRESS,WAITING_FOR_REQUESTER" color="warning" />
        <MetricCard title="Resolved" count={metrics.resolved} statuses="RESOLVED" color="success" />
        <MetricCard title="Closed" count={metrics.closed} statuses="CLOSED" color="secondary" />
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">Recently Updated Tickets</h5>
        </div>
        <div className="card-body p-0">
          {recentlyUpdated.length === 0 ? (
            <div className="text-center p-5 text-muted" data-testid="empty-recent-tickets">
              <p className="mb-0">You don't have any tickets yet.</p>
              <button className="btn btn-outline-success mt-3" onClick={onCreateTicket}>
                Create your first ticket
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyUpdated.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => onViewTicket(t.id)} 
                      style={{ cursor: "pointer" }}
                      data-testid={`recent-ticket-${t.id}`}
                    >
                      <td>
                        <div className="fw-bold">{t.ticketNumber}</div>
                        <div className="small text-muted">{t.summary}</div>
                      </td>
                      <td>{t.category?.name}</td>
                      <td>
                        <span className={`badge bg-${t.currentStatus === 'NEW' ? 'info' : t.currentStatus === 'RESOLVED' ? 'success' : 'secondary'}`}>
                          {t.currentStatus}
                        </span>
                      </td>
                      <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
