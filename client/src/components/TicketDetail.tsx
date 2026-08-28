import { useEffect, useState } from "react";

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

interface TicketDetailData {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  currentStatus: string;
  requestedPriority: string;
  category: { name: string };
  relatedSystem: { name: string };
  createdAt: string;
  attachments: Attachment[];
}

interface TicketDetailProps {
  ticketId: number;
  requesterId: number;
  onBack: () => void;
}

export function TicketDetail({ ticketId, requesterId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment form state
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId, requesterId]);

  const fetchTicket = () => {
    fetch(`/api/tickets/${ticketId}?requesterId=${requesterId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load ticket details");
        return res.json();
      })
      .then((data) => {
        setTicket(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;

    setUploading(true);
    setAttachError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId,
          fileName,
          fileUrl,
          fileType: "application/octet-stream", // mock
          fileSize: 1024, // mock size
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add attachment");
      }

      setFileName("");
      setFileUrl("");
      fetchTicket(); // Reload ticket to get updated attachments
    } catch (err: any) {
      setAttachError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: number) => {
    if (!confirm("Are you sure you want to remove this attachment?")) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}?requesterId=${requesterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove attachment");
      fetchTicket();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const zen = "#006B3C";

  if (loading) {
    return (
      <div className="container py-4 text-center" data-testid="detail-loading">
        <div className="spinner-border text-success" role="status" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" data-testid="detail-error">{error || "Ticket not found"}</div>
        <button className="btn btn-outline-secondary" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <button className="btn btn-sm btn-outline-secondary mb-3" onClick={onBack} data-testid="back-btn">
        &larr; Back to Tickets
      </button>

      <div className="card shadow-sm mb-4" style={{ borderTop: `4px solid ${zen}` }} data-testid="ticket-detail-view">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="card-title mb-0" style={{ color: zen }} data-testid="detail-number">
              {ticket.ticketNumber}
            </h4>
            <span className="badge bg-info fs-6">{ticket.currentStatus}</span>
          </div>

          <div className="row mb-3">
            <div className="col-12 col-md-8">
              <p className="text-muted mb-1 small">Summary</p>
              <h5 data-testid="detail-summary">{ticket.summary}</h5>
            </div>
            <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
              <p className="text-muted mb-1 small">Created At</p>
              <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-muted mb-1 small">Description</p>
            <div className="p-3 bg-light rounded" style={{ whiteSpace: "pre-wrap" }} data-testid="detail-description">
              {ticket.description || "No description provided."}
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <p className="text-muted mb-1 small">Category</p>
              <strong data-testid="detail-category">{ticket.category.name}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted mb-1 small">System</p>
              <strong data-testid="detail-system">{ticket.relatedSystem.name}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted mb-1 small">Priority</p>
              <strong data-testid="detail-priority">{ticket.requestedPriority}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm" data-testid="attachments-section">
        <div className="card-header bg-white fw-bold">Attachments ({ticket.attachments.length}/5)</div>
        <div className="card-body">
          {ticket.attachments.length > 0 ? (
            <ul className="list-group mb-3">
              {ticket.attachments.map((att) => (
                <li key={att.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <a href={att.fileUrl} target="_blank" rel="noreferrer" className="text-decoration-none">
                    📄 {att.fileName}
                  </a>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveAttachment(att.id)}
                    data-testid={`remove-attach-${att.id}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted small">No attachments yet.</p>
          )}

          {ticket.attachments.length < 5 && (
            <form onSubmit={handleAddAttachment} className="mt-3 p-3 bg-light rounded" data-testid="add-attachment-form">
              <h6 className="mb-3">Add New Attachment</h6>
              {attachError && <div className="alert alert-danger py-2">{attachError}</div>}
              <div className="row g-2 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label small mb-1">File Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g., error.png"
                    data-testid="attach-filename"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small mb-1">Mock File URL</label>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/error.png"
                    data-testid="attach-url"
                  />
                </div>
                <div className="col-12 col-md-2">
                  <button type="submit" className="btn btn-sm btn-primary w-100" disabled={uploading} data-testid="attach-submit">
                    {uploading ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </form>
          )}
          {ticket.attachments.length >= 5 && (
            <div className="alert alert-warning py-2 mb-0 mt-3 small">
              Maximum attachment limit (5) reached.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
