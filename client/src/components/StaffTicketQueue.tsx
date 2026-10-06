import { useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "./common/Badges";
/* ─── Types ─── */
interface QueueTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  requestedPriority: string;
  itPriority: string | null;
  createdAt: string;
  category: { name: string } | null;
  relatedSystem: { name: string } | null;
  requesterUser: { fullName: string } | null;
  assignedStaff: { fullName: string } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Category {
  id: number;
  name: string;
}

interface StaffTicketQueueProps {
  userId: number;
  onViewTicket: (id: number) => void;
  initialFilters?: {
    status?: string;
    owner?: string;
    reqPriority?: string;
    isUrgent?: boolean;
  };
}

/* ─── Constants ─── */
const ZEN = "#006B3C";
const ZEN_HOVER = "#0B7A46";
const ZEN_PALE = "#EAF6EF";

const STATUS_OPTIONS = [
  "NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER",
  "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"
];

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-info",
  OPEN: "bg-primary",
  IN_PROGRESS: "bg-warning text-dark",
  WAITING_FOR_REQUESTER: "bg-secondary",
  RESOLVED: "bg-success",
  CLOSED: "bg-dark",
  REOPENED: "bg-danger",
  CANCELLED: "bg-secondary",
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-secondary",
  MEDIUM: "bg-info",
  HIGH: "bg-warning text-dark",
  URGENT: "bg-danger",
};

function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Component ─── */
export function StaffTicketQueue({ userId, onViewTicket, initialFilters }: StaffTicketQueueProps) {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilters?.status || "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [reqPriorityFilter, setReqPriorityFilter] = useState(initialFilters?.reqPriority || "");
  const [itPriorityFilter, setItPriorityFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState(initialFilters?.owner || ""); // "", "unassigned", "me", or staff id
  const [isUrgentFilter, setIsUrgentFilter] = useState(initialFilters?.isUrgent || false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.status !== undefined) setStatusFilter(initialFilters.status);
      if (initialFilters.owner !== undefined) setOwnerFilter(initialFilters.owner);
      if (initialFilters.reqPriority !== undefined) setReqPriorityFilter(initialFilters.reqPriority);
      if (initialFilters.isUrgent !== undefined) setIsUrgentFilter(initialFilters.isUrgent);
    }
  }, [initialFilters]);

  const hasActiveFilters = search || statusFilter || categoryFilter || reqPriorityFilter || itPriorityFilter || ownerFilter || isUrgentFilter;

  // Fetch categories for filter dropdown
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  // Fetch queue data
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      sortBy,
      sortOrder,
    });

    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (reqPriorityFilter) params.set("requestedPriority", reqPriorityFilter);
    if (itPriorityFilter) params.set("itPriority", itPriorityFilter);
    if (ownerFilter === "me") {
      params.set("assignedTo", String(userId));
    } else if (ownerFilter === "unassigned") {
      params.set("assignedTo", "unassigned");
    }

    const token = localStorage.getItem("token") || "";
    fetch(`/api/staff/queue?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403) throw new Error("FORBIDDEN");
        if (!res.ok) throw new Error("Failed to load queue");
        return res.json();
      })
      .then((data) => {
        setTickets(data.data);
        setPagination(data.pagination);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, search, statusFilter, categoryFilter, reqPriorityFilter, itPriorityFilter, ownerFilter, isUrgentFilter, sortBy, sortOrder, userId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter, reqPriorityFilter, itPriorityFilter, ownerFilter, isUrgentFilter, sortBy, sortOrder]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setReqPriorityFilter("");
    setItPriorityFilter("");
    setOwnerFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
  }

  // ── Forbidden state ──
  if (error === "FORBIDDEN") {
    return (
      <div className="container py-5 text-center" data-testid="forbidden-message">
        <div className="alert alert-danger d-inline-block px-5 py-4">
          <h4>🚫 Access Denied</h4>
          <p className="mb-0">You do not have permission to view the IT Staff Ticket Queue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      <div className="card shadow-sm" style={{ borderTop: `4px solid ${ZEN}` }}>
        <div className="card-body">
          <h4 className="card-title mb-4" style={{ color: ZEN }}>
            IT Staff Ticket Queue
          </h4>

          {/* ── Toolbar / Filters ── */}
          {isUrgentFilter && (
            <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center" data-testid="urgent-filter-alert">
              <span><strong>Urgent Tickets Mode:</strong> Showing tickets with URGENT or HIGH priority (Requester or IT).</span>
              <button className="btn btn-sm btn-outline-danger" onClick={() => setIsUrgentFilter(false)}>Clear Urgent Filter</button>
            </div>
          )}
          <div className="row g-2 mb-3" data-testid="queue-filters">
            {/* Search */}
            <div className="col-12 col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search ticket # or summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="queue-search"
              />
            </div>

            {/* Status */}
            <div className="col-6 col-md-2">
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} data-testid="queue-status-filter">
                <option value="">All Status</option>
                <option value="OPEN,REOPENED">Open & Reopened</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="col-6 col-md-2">
              <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} data-testid="queue-category-filter">
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Req Priority */}
            <div className="col-6 col-md-2">
              <select className="form-select" value={reqPriorityFilter} onChange={(e) => setReqPriorityFilter(e.target.value)} data-testid="queue-req-priority-filter">
                <option value="">Req Priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* IT Priority */}
            <div className="col-6 col-md-2">
              <select className="form-select" value={itPriorityFilter} onChange={(e) => setItPriorityFilter(e.target.value)} data-testid="queue-it-priority-filter">
                <option value="">IT Priority</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Second row: Owner + Sort ── */}
          <div className="row g-2 mb-4">
            <div className="col-6 col-md-2">
              <select className="form-select" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} data-testid="queue-owner-filter">
                <option value="">All Owners</option>
                <option value="unassigned">Unassigned</option>
                <option value="me">Assigned to Me</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} data-testid="queue-sort-by">
                <option value="createdAt">Sort: Created</option>
                <option value="requestedPriority">Sort: Req Priority</option>
                <option value="itPriority">Sort: IT Priority</option>
                <option value="currentStatus">Sort: Status</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select className="form-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} data-testid="queue-sort-order">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="col-6 col-md-2 d-flex align-items-center">
                <button
                  className="btn btn-sm btn-outline-secondary w-100"
                  onClick={clearFilters}
                  data-testid="queue-clear-filters"
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="text-center my-5" data-testid="queue-loading">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && error !== "FORBIDDEN" && (
            <div className="alert alert-danger" data-testid="queue-error">
              Something went wrong, please try again later.
            </div>
          )}

          {/* ── Empty State (no tickets exist at all) ── */}
          {!loading && !error && pagination.total === 0 && !hasActiveFilters && (
            <div className="text-center py-5" data-testid="queue-empty-state">
              <div style={{ fontSize: "3rem", opacity: 0.4 }}>📋</div>
              <p className="text-muted mt-2">No tickets in the system yet.</p>
            </div>
          )}

          {/* ── No Results State (tickets exist but filters don't match) ── */}
          {!loading && !error && pagination.total === 0 && hasActiveFilters && (
            <div className="text-center py-5" data-testid="queue-no-results">
              <div style={{ fontSize: "3rem", opacity: 0.4 }}>🔍</div>
              <p className="text-muted mt-2">No tickets match your current filters.</p>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={clearFilters}
                data-testid="queue-no-results-clear"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* ── Desktop Table (≥992px) ── */}
          {!loading && !error && tickets.length > 0 && (
            <>
              <div className="d-none d-lg-block">
                <div className="table-responsive">
                  <table className="table table-hover align-middle" data-testid="queue-table">
                    <thead style={{ backgroundColor: ZEN_PALE }}>
                      <tr>
                        <th>Ticket #</th>
                        <th>Created</th>
                        <th>Summary</th>
                        <th>Category</th>
                        <th>Req Priority</th>
                        <th>IT Priority</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody data-testid="queue-table-body">
                      {tickets.map((t) => (
                        <tr key={t.id} data-testid={`queue-row-${t.id}`}>
                          <td className="fw-bold">{t.ticketNumber}</td>
                          <td className="small text-muted">{new Date(t.createdAt).toLocaleDateString()}</td>
                          <td>{t.summary}</td>
                          <td>{t.category?.name || "—"}</td>
                          <td>
                            <PriorityBadge priority={t.requestedPriority} />
                          </td>
                          <td>
                            {t.itPriority ? <PriorityBadge priority={t.itPriority} /> : "—"}
                          </td>
                          <td>
                            <StatusBadge status={t.currentStatus} />
                          </td>
                          <td>{t.assignedStaff?.fullName || <span className="text-muted fst-italic">Unassigned</span>}</td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: ZEN, color: "#fff" }}
                              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = ZEN_HOVER)}
                              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = ZEN)}
                              onClick={() => onViewTicket(t.id)}
                              data-testid={`queue-view-${t.id}`}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 📱 Mobile / Tablet Cards (<992px) 📱 */}
              <div className="d-lg-none row" data-testid="queue-cards">
                {tickets.map((t) => (
                  <div key={t.id} className="col-12 col-md-6 mb-3">
                    <div
                      className="card shadow-sm h-100"
                      style={{ borderLeft: `4px solid ${ZEN}` }}
                      data-testid={`queue-card-${t.id}`}
                    >
                    <div className="card-body py-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="fw-bold" style={{ color: ZEN }}>{t.ticketNumber}</span>
                          <span className="text-muted small ms-2">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        <StatusBadge status={t.currentStatus} />
                      </div>
                      <p className="mb-2 fw-semibold">{t.summary}</p>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <PriorityBadge priority={t.requestedPriority} />
                        {t.itPriority && <PriorityBadge priority={t.itPriority} />}
                        {t.category && <span className="badge bg-light text-dark border">{t.category.name}</span>}
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {t.assignedStaff ? t.assignedStaff.fullName : "Unassigned"}
                        </small>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: ZEN, color: "#fff", minWidth: 60 }}
                          onClick={() => onViewTicket(t.id)}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>

              {/* ── Pagination ── */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3" data-testid="queue-pagination">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="queue-prev-page"
                  >
                    ← Previous
                  </button>
                  <span className="text-muted small">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
                  </span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="queue-next-page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
