import { useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "../common/Badges";

// BR-METRIC-04: Staff Open = OPEN + REOPENED
const STAFF_OPEN_STATUSES = "OPEN,REOPENED";

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  requestedPriority: string;
  createdAt: string;
  updatedAt: string;
  category: { name: string } | null;
  assignedStaff: { fullName: string } | null;
}

interface StaffDashboardData {
  metrics: {
    new: number;
    open: number;
    inProgress: number;
    waiting: number;
    myAssigned: number;
    urgent: number;
    totalUsers?: number;
  };
  recentlyUpdated: Ticket[];
}

interface StaffDashboardProps {
  onNavigateToQueue: (filters: { status?: string; owner?: string; reqPriority?: string; isUrgent?: boolean }) => void;
  onViewTicket: (id: number) => void;
  userRole: string;
}

export function StaffDashboard({ onNavigateToQueue, onViewTicket, userRole }: StaffDashboardProps) {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/staff", {
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

  const MetricCard = ({ title, count, filters, color, testId }: { title: string, count: number, filters: any, color: string, testId: string }) => (
    <div className="col-sm-6 col-md-4 mb-3">
      <div 
        className={`card h-100 shadow-sm border-0 border-start border-${color}`} 
        style={{ cursor: "pointer", transition: "transform 0.2s", borderLeftWidth: "5px" }}
        onClick={() => onNavigateToQueue(filters)}
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        data-testid={testId}
      >
        <div className="card-body text-center">
          <h5 className="card-title text-muted">{title}</h5>
          <h2 className="display-4 fw-bold text-dark mb-0">{count}</h2>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container" data-testid="staff-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>{userRole === 'ADMINISTRATOR' ? 'Admin Dashboard' : 'IT Staff Dashboard'}</h4>
        <button 
          className="btn btn-outline-primary" 
          onClick={() => onNavigateToQueue({})}
          style={{ borderColor: "#006B3C", color: "#006B3C" }}
          data-testid="view-full-queue-btn"
        >
          View Full Queue
        </button>
      </div>

      {userRole === 'ADMINISTRATOR' && metrics.totalUsers !== undefined && (
        <div className="alert alert-info mb-4" data-testid="admin-stats">
          <strong>System Users:</strong> {metrics.totalUsers} registered accounts
        </div>
      )}

      <div className="row mb-4">
        <MetricCard title="New Tickets" count={metrics.new} filters={{ status: 'NEW' }} color="info" testId="metric-new" />
        <MetricCard title="Open Tickets" count={metrics.open} filters={{ status: STAFF_OPEN_STATUSES }} color="primary" testId="metric-open" />
        <MetricCard title="In Progress" count={metrics.inProgress} filters={{ status: 'IN_PROGRESS' }} color="warning" testId="metric-in-progress" />
        <MetricCard title="Waiting for Requester" count={metrics.waiting} filters={{ status: 'WAITING_FOR_REQUESTER' }} color="secondary" testId="metric-waiting" />
        <MetricCard title="My Assigned" count={metrics.myAssigned} filters={{ owner: 'me' }} color="success" testId="metric-my-assigned" />
        <MetricCard title="Urgent Tickets" count={metrics.urgent} filters={{ isUrgent: true }} color="danger" testId="metric-urgent" />
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0">Recently Updated Tickets</h5>
        </div>
        <div className="card-body p-0">
          {recentlyUpdated.length === 0 ? (
            <div className="text-center p-5 text-muted" data-testid="empty-recent-tickets">
              <p className="mb-0">No active tickets recently updated.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
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
                        <StatusBadge status={t.currentStatus} />
                      </td>
                      <td>
                        <PriorityBadge priority={t.requestedPriority} />
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
