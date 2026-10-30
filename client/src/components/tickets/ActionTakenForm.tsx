import { useState } from 'react';

export interface ActionTakenPayload {
  actionDateTime: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  version?: number;
}

interface ActionTakenFormProps {
  initialData?: any;
  onSubmit: (data: ActionTakenPayload) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ZEN = "#006B3C";

const getLocalDatetimeLocal = (date?: string | Date) => {
  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const ActionTakenForm = ({ initialData, onSubmit, onCancel, isSubmitting }: ActionTakenFormProps) => {
  const [actionDateTime, setActionDateTime] = useState(initialData?.actionDateTime ? getLocalDatetimeLocal(initialData.actionDateTime) : getLocalDatetimeLocal());
  const [description, setDescription] = useState(initialData?.description || '');
  const [result, setResult] = useState(initialData?.result || '');
  const [followUpRequired, setFollowUpRequired] = useState(initialData?.followUpRequired || false);
  const [followUpNote, setFollowUpNote] = useState(initialData?.followUpNote || '');
  const [attachmentNotes, setAttachmentNotes] = useState(initialData?.attachmentNotes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!result.trim()) {
      setError('Result is required');
      return;
    }
    if (followUpRequired && !followUpNote.trim()) {
      setError('Follow-up note is required when follow-up is required');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        actionDateTime: new Date(actionDateTime).toISOString(),
        description,
        result,
        followUpRequired,
        followUpNote: followUpRequired ? followUpNote : undefined,
        attachmentNotes,
        version: initialData?.version,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit action taken');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="border p-3 rounded bg-white shadow-sm mt-3" data-testid="action-taken-form">
      <h6 className="mb-3">{initialData ? 'Edit Action Taken' : 'Add New Action Taken'}</h6>
      {error && <div className="alert alert-danger py-2 small" data-testid="action-taken-error">{error}</div>}
      
      <div className="mb-2">
        <label htmlFor="atDateTime" className="form-label small fw-bold">Date & Time</label>
        <input id="atDateTime" type="datetime-local" className="form-control form-control-sm" value={actionDateTime} onChange={(e) => setActionDateTime(e.target.value)} disabled={isSubmitting} />
      </div>
      
      <div className="mb-2">
        <label htmlFor="atDesc" className="form-label small fw-bold">Description *</label>
        <textarea id="atDesc" className="form-control form-control-sm" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} required aria-required="true" disabled={isSubmitting} placeholder="What did you do?" />
      </div>
      
      <div className="mb-2">
        <label htmlFor="atResult" className="form-label small fw-bold">Result *</label>
        <textarea id="atResult" className="form-control form-control-sm" rows={2} value={result} onChange={(e) => setResult(e.target.value)} required aria-required="true" disabled={isSubmitting} placeholder="What was the outcome?" />
      </div>
      
      <div className="mb-2 form-check">
        <input type="checkbox" className="form-check-input" id="followUpCheck" checked={followUpRequired} onChange={(e) => {
          setFollowUpRequired(e.target.checked);
          if (!e.target.checked) setFollowUpNote('');
        }} disabled={isSubmitting} />
        <label className="form-check-label small fw-bold" htmlFor="followUpCheck">Follow-up Required</label>
      </div>
      
      {followUpRequired && (
        <div className="mb-2">
          <label htmlFor="atFollowUpNote" className="form-label small fw-bold text-danger">Follow-up Note *</label>
          <textarea id="atFollowUpNote" className="form-control form-control-sm border-danger" rows={2} value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} aria-required="true" disabled={isSubmitting} placeholder="Why is follow-up needed?" />
        </div>
      )}
      
      <div className="mb-3">
        <label htmlFor="atAttachmentNotes" className="form-label small fw-bold">Attachment Notes</label>
        <input id="atAttachmentNotes" type="text" className="form-control form-control-sm" value={attachmentNotes} onChange={(e) => setAttachmentNotes(e.target.value)} disabled={isSubmitting} placeholder="Optional notes about attachments" />
      </div>
      
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button type="submit" className="btn btn-sm text-white" style={{ backgroundColor: ZEN, borderColor: ZEN }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Action'}
        </button>
      </div>
    </form>
  );
};
