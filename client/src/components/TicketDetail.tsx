import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isRemoved: boolean;
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

// ── Constants ─────────────────────────────────────────────────────────────────
const ZEN = "#006B3C";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = "JPG, PNG, WEBP, PDF";

// ── Priority badge colour ─────────────────────────────────────────────────────
function priorityBadge(priority: string) {
  const map: Record<string, string> = { High: "danger", Medium: "warning", Low: "success" };
  return map[priority] ?? "secondary";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    New: "info",
    "In Progress": "primary",
    Resolved: "success",
    Closed: "secondary",
  };
  return map[status] ?? "secondary";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TicketDetail({ ticketId, requesterId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTicket();
  }, [ticketId, requesterId]);

  const loadTicket = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/${ticketId}?requesterId=${requesterId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Access denied." : "Failed to load ticket.");
        return r.json();
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

  // ── Client-side file validation ─────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) { setSelectedFile(null); return; }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS}.`);
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File exceeds the 5 MB limit.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { setUploadError("Please select a file."); return; }
    if (!ticket || ticket.attachments.length >= 5) {
      setUploadError("Cannot upload: maximum of 5 attachments already reached.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("requesterId", String(requesterId));

    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed.");
      }
      setUploadSuccess(`"${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadTicket();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (attachmentId: number) => {
    if (!confirm("Remove this attachment? This action cannot be undone.")) return;
    try {
      const res = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachmentId}?requesterId=${requesterId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Remove failed.");
      }
      loadTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Remove failed.");
    }
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="detail-loading">
        <div className="spinner-border" style={{ color: ZEN }} role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-4" data-testid="detail-error-container">
        <div className="alert alert-danger" data-testid="detail-error">
          {error ?? "Ticket not found."}
        </div>
        <button className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((a) => !a.isRemoved);
  const canUpload = activeAttachments.length < 5;

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>
      {/* Back */}
      <button
        className="btn btn-sm btn-outline-secondary mb-3"
        onClick={onBack}
        data-testid="back-btn"
      >
        ← Back to Tickets
      </button>

      {/* ── Ticket Info Card ── */}
      <div
        className="card shadow-sm mb-4"
        style={{ borderTop: `4px solid ${ZEN}` }}
        data-testid="ticket-detail-view"
      >
        <div className="card-body">
          {/* Header row */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
            <div>
              <span className="text-muted small d-block mb-1">Ticket Number</span>
              <h4 className="mb-0 fw-bold" style={{ color: ZEN }} data-testid="detail-number">
                {ticket.ticketNumber}
              </h4>
            </div>
            <div className="d-flex gap-2">
              <span className={`badge bg-${statusBadge(ticket.currentStatus)} fs-6`}>
                {ticket.currentStatus}
              </span>
              <span className={`badge bg-${priorityBadge(ticket.requestedPriority)} fs-6`}>
                {ticket.requestedPriority}
              </span>
            </div>
          </div>

          {/* Summary + Created */}
          <div className="row mb-3 g-3">
            <div className="col-12 col-md-8">
              <p className="text-muted small mb-1">Summary</p>
              <h5 className="mb-0" data-testid="detail-summary">
                {ticket.summary}
              </h5>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Created</p>
              <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <p className="text-muted small mb-1">Description</p>
            <div
              className="p-3 bg-light rounded border"
              style={{ whiteSpace: "pre-wrap", minHeight: 80 }}
              data-testid="detail-description"
            >
              {ticket.description || "No description provided."}
            </div>
          </div>

          {/* Meta row */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Category</p>
              <strong data-testid="detail-category">{ticket.category.name}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Related System</p>
              <strong data-testid="detail-system">{ticket.relatedSystem.name}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Priority</p>
              <strong data-testid="detail-priority">{ticket.requestedPriority}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Attachments Card ── */}
      <div className="card shadow-sm" data-testid="attachments-section">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <strong>Attachments</strong>
          <span className="badge bg-secondary">{activeAttachments.length} / 5</span>
        </div>
        <div className="card-body">
          {/* Attachment list */}
          {activeAttachments.length === 0 ? (
            <p className="text-muted small mb-3" data-testid="no-attachments">
              No attachments yet.
            </p>
          ) : (
            <ul className="list-group mb-3" data-testid="attachment-list">
              {activeAttachments.map((att) => (
                <li
                  key={att.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  data-testid={`attachment-item-${att.id}`}
                >
                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                    <span>📄</span>
                    <span className="text-truncate" style={{ maxWidth: 300 }}>
                      {att.fileName}
                    </span>
                    <small className="text-muted">
                      ({(att.fileSize / 1024).toFixed(1)} KB)
                    </small>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0">
                    <a
                      href={`/api/tickets/${ticketId}/attachments/${att.id}/download?requesterId=${requesterId}`}
                      className="btn btn-sm btn-outline-primary"
                      data-testid={`download-attach-${att.id}`}
                    >
                      Download
                    </a>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemove(att.id)}
                      data-testid={`remove-attach-${att.id}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Upload form */}
          {canUpload ? (
            <form
              onSubmit={handleUpload}
              className="mt-2 p-3 rounded border bg-light"
              data-testid="upload-form"
            >
              <h6 className="mb-3 fw-semibold" style={{ color: ZEN }}>
                Add Attachment
              </h6>

              {uploadSuccess && (
                <div className="alert alert-success py-2 small" data-testid="upload-success">
                  {uploadSuccess}
                </div>
              )}
              {uploadError && (
                <div className="alert alert-danger py-2 small" data-testid="upload-error">
                  {uploadError}
                </div>
              )}

              <div className="mb-2">
                <label className="form-label small mb-1">
                  File <span className="text-muted">(Max 5 MB — {ALLOWED_EXTENSIONS})</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control form-control-sm"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileChange}
                  data-testid="file-input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-sm"
                style={{ backgroundColor: ZEN, color: "white", borderColor: ZEN }}
                disabled={uploading || !selectedFile}
                data-testid="upload-btn"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </form>
          ) : (
            <div className="alert alert-warning py-2 small mb-0 mt-2" data-testid="max-attach-warning">
              Maximum attachment limit (5) reached. Remove one to add more.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
