import { useEffect, useState } from "react";

interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  currentStatus: string;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

interface MyTicketsProps {
  requesterId: number;
  onViewTicket: (id: number) => void;
}

export function MyTickets({ requesterId, onViewTicket }: MyTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : [])
      .then((cats) => setCategories(cats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      requesterId: String(requesterId),
      ...(search ? { search } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(sortBy ? { sortBy } : {})
    });
    
    fetch(`/api/tickets?${query.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tickets");
        return res.json();
      })
      .then((data) => {
        setTickets(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [requesterId, search, categoryId, sortBy]);

  const zen = "#006B3C";

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <div className="card shadow-sm" style={{ borderTop: `4px solid ${zen}` }}>
        <div className="card-body">
          <h4 className="card-title mb-4" style={{ color: zen }}>
            My Tickets
          </h4>
          
          <div className="row g-2 mb-4">
            <div className="col-md-5">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search summary..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="search-input"
              />
            </div>
            <div className="col-md-4">
              <select 
                className="form-select" 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                data-testid="sort-filter"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center my-4" data-testid="loading-spinner">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" data-testid="fetch-error">
              {error}
            </div>
          )}

          {!loading && !error && tickets.length === 0 && (
            <p className="text-muted" data-testid="empty-tickets">
              No tickets found.
            </p>
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle" data-testid="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket Number</th>
                    <th>Summary</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody data-testid="tickets-table-body">
                  {tickets.map((t) => (
                    <tr key={t.id} data-testid={`ticket-row-${t.id}`}>
                      <td className="fw-bold">{t.ticketNumber}</td>
                      <td>{t.summary}</td>
                      <td>
                        <span className={`badge bg-${t.currentStatus === 'New' ? 'info' : 'secondary'}`}>
                          {t.currentStatus}
                        </span>
                      </td>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onViewTicket(t.id)}
                          data-testid={`view-ticket-${t.id}`}
                        >
                          View
                        </button>
                      </td>
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
