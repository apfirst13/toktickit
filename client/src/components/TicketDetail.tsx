import { useEffect, useRef, useState } from "react";

interface UserInfo {
  id?: number;
  fullName: string;
  role?: string;
}

interface PublicComment {
  id: number;
  content: string;
  createdAt: string;
  author: UserInfo;
}

interface InternalNote {
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
  itPriority: string;
  category: { name: string };
  relatedSystem: { name: string };
  createdAt: string;
  attachments: Attachment[];
  publicComments: PublicComment[];
  appearsResolved: boolean;
  requesterUser: { fullName: string } | null;
  assignedStaff: { fullName: string } | null;
  assignedStaffId: number | null;
  requesterUserId: number;
}

interface TicketDetailProps {
  ticketId: number;
  currentUser: { id: number; role: string; fullName?: string };
  onBack: () => void;
}

const ZEN = "#006B3C";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = "JPG, PNG, WEBP, PDF";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: []
};

function priorityBadge(priority: string) {
  const map: Record<string, string> = { URGENT: "danger", HIGH: "danger", MEDIUM: "warning", LOW: "success" };
  return map[priority?.toUpperCase()] ?? "secondary";
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    NEW: "info",
    IN_PROGRESS: "primary",
    RESOLVED: "success",
    CLOSED: "secondary",
  };
  return map[status?.toUpperCase()] ?? "secondary";
}

export function TicketDetail({ ticketId, currentUser, onBack }: TicketDetailProps) {
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

  // Staff specific state
  const isStaff = currentUser.role === "IT_STAFF" || currentUser.role === "ADMINISTRATOR";
  const [staffUsers, setStaffUsers] = useState<UserInfo[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noting, setNoting] = useState(false);

  const [editStatus, setEditStatus] = useState("");
  const [editItPriority, setEditItPriority] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState<string>("");
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    loadTicket();
    if (isStaff) {
      loadStaffUsers();
      loadInternalNotes();
    }
  }, [ticketId]);

  const getToken = () => localStorage.getItem("token") || "";

  const loadTicket = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/${ticketId}`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(r.status === 403 ? "Access denied." : "Failed to load ticket.");
        return r.json();
      })
      .then(data => {
        setTicket(data);
        setEditStatus(data.currentStatus);
        setEditItPriority(data.itPriority || "LOW");
        setEditAssignedTo(data.assignedStaffId ? String(data.assignedStaffId) : "unassigned");
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const loadStaffUsers = () => {
    fetch(`/api/staff/users`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(data => setStaffUsers(data))
      .catch(() => {});
  };

  const loadInternalNotes = () => {
    fetch(`/api/tickets/${ticketId}/notes`, {
      headers: { "Authorization": `Bearer ${getToken()}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInternalNotes(data); })
      .catch(() => {});
  };

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
      const payload: any = {
        itPriority: editItPriority,
        assignedStaffId: editAssignedTo === "unassigned" ? null : Number(editAssignedTo)
      };
      if (editStatus !== ticket?.currentStatus) {
        payload.status = editStatus;
      }
      
      const res = await fetch(`/api/staff/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      loadTicket();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ content: newNote.trim() })
      });
      if (!res.ok) throw new Error("Failed to post note");
      setNewNote("");
      loadInternalNotes();
    } catch (err) {
      alert("Failed to post note.");
    } finally {
      setNoting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) { setSelectedFile(null); return; }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS}`);
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

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const canUpload = activeAttachments.length < 5;
  const allowedTransitions = ALLOWED_TRANSITIONS[ticket.currentStatus] || [];

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

        {(!ticket.appearsResolved && ticket.currentStatus !== "RESOLVED" && ticket.currentStatus !== "CLOSED" && !isStaff) && (
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-2">
            <div>
              <span className="text-muted small d-block mb-1">Ticket Number</span>
              <h4 className="mb-0 fw-bold" style={{ color: ZEN }} data-testid="detail-number">
                {ticket.ticketNumber}
                {ticket.appearsResolved && (
                  <span className="badge bg-success ms-2 fs-6">Appears Resolved</span>
                )}
              </h4>
              <div className="mt-2 text-muted small">
                Requester: <strong>{ticket.requesterUser?.fullName}</strong>
              </div>
            </div>
            
            {!isStaff ? (
              <div className="d-flex gap-2">
                <span className={`badge fs-6 bg-${statusBadge(ticket.currentStatus)}`}>
                  {ticket.currentStatus}
                </span>
                <span className={`badge fs-6 bg-${priorityBadge(ticket.requestedPriority)}`}>
                  Req: {ticket.requestedPriority}
                </span>
                <span className={`badge fs-6 bg-${priorityBadge(ticket.itPriority || ticket.requestedPriority)}`}>
                  IT: {ticket.itPriority || "Unset"}
                </span>
                <span className="badge bg-info text-dark fs-6">
                  {ticket.assignedStaff ? ticket.assignedStaff.fullName : "Unassigned"}
                </span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 p-3 bg-light border rounded" style={{ minWidth: "280px" }}>
                <strong className="text-dark small border-bottom pb-1 mb-1">IT Operational Controls</strong>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-muted">Status:</span>
                  <select 
                    className="form-select form-select-sm w-auto" 
                    value={editStatus} 
                    onChange={e => setEditStatus(e.target.value)}
                    data-testid="status-select"
                  >
                    <option value={ticket.currentStatus}>{ticket.currentStatus}</option>
                    {allowedTransitions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-muted">IT Priority:</span>
                  <select 
                    className="form-select form-select-sm w-auto" 
                    value={editItPriority} 
                    onChange={e => setEditItPriority(e.target.value)}
                    data-testid="itpriority-select"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="small text-muted">Assign To:</span>
                  <select 
                    className="form-select form-select-sm w-auto" 
                    value={editAssignedTo} 
                    onChange={e => setEditAssignedTo(e.target.value)}
                    data-testid="assign-select"
                  >
                    <option value="unassigned">Unassigned</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={String(u.id)}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="btn btn-sm btn-primary mt-2" 
                  disabled={savingMeta || (editStatus === ticket.currentStatus && editItPriority === (ticket.itPriority || "LOW") && editAssignedTo === (ticket.assignedStaffId ? String(ticket.assignedStaffId) : "unassigned"))}
                  onClick={handleSaveMeta}
                  data-testid="save-meta-btn"
                >
                  {savingMeta ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
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
              <strong data-testid="detail-category">{ticket.category?.name || 'N/A'}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Related System</p>
              <strong data-testid="detail-system">{ticket.relatedSystem?.name || 'N/A'}</strong>
            </div>
            <div className="col-12 col-md-4">
              <p className="text-muted small mb-1">Req Priority</p>
              <strong data-testid="detail-priority">{ticket.requestedPriority}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow-sm h-100 mb-4">
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

          {isStaff && (
            <div className="card shadow-sm h-100 border-warning">
              <div className="card-header" style={{ backgroundColor: "#FFFBEB", borderBottom: "1px solid #F59E0B" }}>
                <strong className="text-warning-emphasis">Internal Operational Notes - IT Staff Only</strong>
              </div>
              <div className="card-body d-flex flex-column" style={{ backgroundColor: "#FFFBEB" }}>
                <div className="flex-grow-1 mb-3" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {internalNotes && internalNotes.length > 0 ? (
                    internalNotes.map((note) => (
                      <div key={note.id} className="mb-3 p-3 border rounded bg-white" style={{ borderColor: "#FCD34D" }}>
                        <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                          <strong>{note.author.fullName} <span className="badge bg-warning text-dark ms-1">{note.author.role}</span></strong>
                          <small className="text-muted">{new Date(note.createdAt).toLocaleString()}</small>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{note.content}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small">No internal notes yet.</p>
                  )}
                </div>
                <form onSubmit={handleNoteSubmit} className="mt-auto pt-3 border-top" style={{ borderColor: "#F59E0B" }}>
                  <div className="mb-2">
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      placeholder="Add an internal note..." 
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-sm btn-warning" disabled={noting || !newNote.trim()}>
                    {noting ? "Saving Note..." : "Save Internal Note"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="col-md-5">
          <div className="card shadow-sm h-100" data-testid="attachments-section">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <strong>Attachments</strong>
              <span className="badge bg-secondary">{activeAttachments.length} / 5</span>
            </div>
            <div className="card-body">
              {ticket.attachments?.length === 0 ? (
                <p className="text-muted small mb-3" data-testid="no-attachments">
                  No attachments yet.
                </p>
              ) : (
                <ul className="list-group mb-3" data-testid="attachment-list">
                  {ticket.attachments?.map((att) => (
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
                          {(att.fileSize / 1024).toFixed(1)} KB
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
                            title="Download"
                            data-testid={`download-attach-${att.id}`}
                          >
                            ⬇️
                          </button>
                          {(ticket.requesterUserId === currentUser.id || isStaff) && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemove(att.id)}
                              title="Remove"
                              data-testid={`remove-attach-${att.id}`}
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {!canUpload && (
                <div data-testid="max-attach-warning" className="text-warning small mb-3">
                  Maximum of 5 attachments reached.
                </div>
              )}
              {canUpload && (ticket.requesterUserId === currentUser.id || isStaff) && (
                <form data-testid="upload-form" onSubmit={handleUpload}>
                  <div className="mb-2">
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={uploading}
                      data-testid="file-input"
                    />
                    <small className="text-muted d-block mt-1">
                      Allowed: {ALLOWED_EXTENSIONS}. Max 5MB.
                    </small>
                  </div>
                  {uploadError && <div data-testid="upload-error" className="text-danger small mb-2">{uploadError}</div>}
                  {uploadSuccess && <div data-testid="upload-success" className="text-success small mb-2">{uploadSuccess}</div>}
                  
                  <button
                    type="submit"
                    className="btn btn-sm btn-secondary w-100"
                    disabled={!selectedFile || uploading}
                    data-testid="upload-btn"
                  >
                    {uploading ? "Uploading..." : "Upload Attachment"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
