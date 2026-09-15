import { useEffect, useRef, useState } from "react";

interface UserInfo {
  fullName: string;
  role: string;
}

interface PublicComment {
  id: number;
  content: string;
  createdAt: string;
  author: UserInfo;
}

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isRemoved: boolean;
  removalReason?: string;
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
  publicComments: PublicComment[];
  appearsResolved: boolean;
}

interface TicketDetailProps {
  ticketId: number;
  requesterId: number;
  onBack: () => void;
}

const ZEN = "#006B3C";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = "JPG, PNG, WEBP, PDF";

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

export function TicketDetail({ ticketId, requesterId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [removalTargetId, setRemovalTargetId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");

  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId, requesterId]);

  const getToken = () => localStorage.getItem("token") || "";

  const loadTicket = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/${ticketId}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
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

    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${getToken()}` },
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

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download file.");
    }
  };

  const handleRemove = (attachmentId: number) => {
    setRemovalTargetId(attachmentId);
  };

  const confirmRemove = async () => {
    if (!removalTargetId) return;
    if (!removalReason.trim()) {
      alert("Removal reason is required.");
      return;
    }

    try {
      const res = await fetch(
        `/api/tickets/${ticketId}/attachments/${removalTargetId}`,
        { 
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
          },
          body: JSON.stringify({ removalReason })
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Remove failed.");
      }
      setRemovalTargetId(null);
      setRemovalReason("");
      loadTicket();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Remove failed.");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      loadTicket();
    } catch (err) {
      alert("Failed to post comment.");
    } finally {
      setCommenting(false);
    }
  };

  const handleAppearsResolved = async () => {
    if (!window.confirm("Mark this problem as appearing resolved?")) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/appears-resolved`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadTicket();
    } catch (err) {
      alert("Failed to mark as resolved.");
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="detail-loading">
        <div className="spinner-border" style={{ color: ZEN }} role="status">
          <span className="visually-hidden">Loading...</span>
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
          Back to Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments.filter((a) => !a.isRemoved);
  const canUpload = activeAttachments.length < 5;

  return (
    <div className="container py-4" style={{ maxWidth: 860 }}>
      {removalTargetId && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remove Attachment</h5>
                <button type="button" className="btn-close" onClick={() => { setRemovalTargetId(null); setRemovalReason(""); }}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to remove this attachment?</p>
                <div className="mb-3">
                  <label className="form-label">Removal Reason (Required)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    data-testid="removal-reason-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setRemovalTargetId(null); setRemovalReason(""); }}>Cancel</button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmRemove} 
                  disabled={!removalReason.trim()}
                  data-testid="confirm-remove-btn"
                >
                  Confirm Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onBack}
          data-testid="back-btn"
        >
          Back to Tickets
        </button>

        {(!ticket.appearsResolved && ticket.currentStatus !== "RESOLVED" && ticket.currentStatus !== "CLOSED") && (
          <button 
            className="btn btn-sm btn-success" 
            onClick={handleAppearsResolved}
            disabled={resolving}
          >
            {resolving ? "Marking..." : "Problem Appears Resolved"}
          </button>
        )}
      </div>

      <div
        className="card shadow-sm mb-4"
        style={{ borderTop: `4px solid ${ZEN}` }}
        data-testid="ticket-detail-view"
      >
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
            <div>
              <span className="text-muted small d-block mb-1">Ticket Number</span>
              <h4 className="mb-0 fw-bold" style={{ color: ZEN }} data-testid="detail-number">
                {ticket.ticketNumber}
                {ticket.appearsResolved && (
                  <span className="badge bg-success ms-2 fs-6">Appears Resolved</span>
                )}
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

      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white">
              <strong>Public Comments</strong>
            </div>
            <div className="card-body d-flex flex-column">
              <div className="flex-grow-1 mb-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {ticket.publicComments && ticket.publicComments.length > 0 ? (
                  ticket.publicComments.map((comment) => (
                    <div key={comment.id} className="mb-3 p-3 border rounded bg-light">
                      <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                        <strong>{comment.author.fullName} <span className="badge bg-secondary ms-1">{comment.author.role}</span></strong>
                        <small className="text-muted">{new Date(comment.createdAt).toLocaleString()}</small>
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{comment.content}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">No public comments yet.</p>
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="mt-auto pt-3 border-top">
                <div className="mb-2">
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Add a public comment..." 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-sm btn-primary" disabled={commenting || !newComment.trim()}>
                  {commenting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card shadow-sm h-100" data-testid="attachments-section">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>Attachments</strong>
              <span className="badge bg-secondary">{activeAttachments.length} / 5</span>
            </div>
            <div className="card-body">
              {ticket.attachments.length === 0 ? (
                <p className="text-muted small mb-3" data-testid="no-attachments">
                  No attachments yet.
                </p>
              ) : (
                <ul className="list-group mb-3" data-testid="attachment-list">
                  {ticket.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                      data-testid={`attachment-item-${att.id}`}
                    >
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <span>📎</span>
                        <span 
                          className={`text-truncate ${att.isRemoved ? 'text-decoration-line-through text-muted' : ''}`} 
                          style={{ maxWidth: 150 }}
                          title={att.fileName}
                        >
                          {att.fileName}
                        </span>
                        <small className="text-muted">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </small>
                        {att.isRemoved && (
                          <span className="badge bg-danger ms-2" data-testid={`removed-badge-${att.id}`}>
                            Removed: {att.removalReason}
                          </span>
                        )}
                      </div>
                      {!att.isRemoved && (
                        <div className="d-flex gap-2 flex-shrink-0">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownload(att.id, att.fileName)}
                            data-testid={`download-attach-${att.id}`}
                          >
                            DL
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemove(att.id)}
                            data-testid={`remove-attach-${att.id}`}
                          >
                            Del
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

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
                    {uploading ? "Uploading..." : "Upload"}
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
      </div>
    </div>
  );
}
