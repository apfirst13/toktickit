import { useState, useEffect, useRef } from 'react';
import { ActionTakenForm, ActionTakenPayload } from './ActionTakenForm';

export interface ActionTaken {
  id: number;
  actionDateTime: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  version: number;
  performedBy: {
    id: number;
    fullName: string;
    role: string;
  };
}

interface ActionsTakenListProps {
  ticketId: number;
  userRole?: string;
}

const ZEN = "#006B3C";

export const ActionsTakenList = ({ ticketId, userRole }: ActionsTakenListProps) => {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const canEdit = userRole === 'IT_STAFF' || userRole === 'ADMINISTRATOR';
  const getToken = () => localStorage.getItem("token") || "";

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tickets/${ticketId}/actions`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load actions taken');
      }
      const data = await res.json();
      setActions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [ticketId]);

  const handleCreate = async (payload: ActionTakenPayload) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create action');
      }
      await fetchActions();
      setIsCreating(false);
    } catch (err: any) {
      throw err; // Let the form handle the error display
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (actionId: number, payload: ActionTakenPayload) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update action');
      }
      await fetchActions();
      setEditingId(null);
    } catch (err: any) {
      throw err;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-secondary" /></div>;

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <strong>Actions Taken</strong>
        {canEdit && !isCreating && !editingId && (
          <button className="btn btn-sm" style={{ color: ZEN, borderColor: ZEN, backgroundColor: 'transparent' }} onClick={() => setIsCreating(true)}>
            + Add Action
          </button>
        )}
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        
        {isCreating && (
          <ActionTakenForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsCreating(false)} 
            isSubmitting={isSubmitting} 
          />
        )}

        {(!Array.isArray(actions) || actions.length === 0) && !isCreating ? (
          <p className="text-muted small mb-0">No actions have been taken yet.</p>
        ) : (
          <div className="mt-3">
            {Array.isArray(actions) && actions.map(action => (
              <div key={action.id} className="mb-3 border-start border-4 ps-3 pb-3 border-bottom" style={{ borderColor: `${ZEN} !important` }}>
                {editingId === action.id ? (
                  <ActionTakenForm 
                    initialData={action}
                    onSubmit={(data) => handleUpdate(action.id, data)}
                    onCancel={() => setEditingId(null)}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold text-dark">{new Date(action.actionDateTime).toLocaleString()}</div>
                        <div className="small text-muted">
                          By: {action.performedBy.fullName} <span className="badge bg-light text-dark border ms-1">{action.performedBy.role}</span>
                        </div>
                      </div>
                      {canEdit && (
                        <button className="btn btn-sm btn-link p-0" style={{ color: ZEN }} onClick={() => setEditingId(action.id)}>
                          Edit
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-1">
                      <span className="small fw-bold text-secondary">Description: </span>
                      <span className="small">{action.description}</span>
                    </div>
                    <div className="mb-1">
                      <span className="small fw-bold text-secondary">Result: </span>
                      <span className="small">{action.result}</span>
                    </div>
                    
                    {action.followUpRequired && (
                      <div className="mt-2 p-2 bg-warning bg-opacity-10 rounded border border-warning">
                        <span className="small fw-bold text-warning-emphasis">⚠️ Follow-up Required: </span>
                        <span className="small text-warning-emphasis">{action.followUpNote}</span>
                      </div>
                    )}
                    
                    {action.attachmentNotes && (
                      <div className="mt-1">
                        <span className="small fw-bold text-secondary">Attachment Notes: </span>
                        <span className="small text-muted">{action.attachmentNotes}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
