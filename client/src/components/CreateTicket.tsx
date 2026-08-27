import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

interface RelatedSystem {
  id: number;
  name: string;
}

interface FormErrors {
  summary?: string;
  description?: string;
  categoryId?: string;
  systemId?: string;
  requestedPriority?: string;
}

interface CreateTicketProps {
  requesterId: number;
  requesterName?: string;
  onSuccess?: (ticketNumber: string) => void;
}

/**
 * CreateTicket component provides a form for creating IT support tickets.
 * Allows users to submit tickets with summary, description, category, system, and priority.
 *
 * @param requesterId - The ID of the user creating the ticket
 * @param requesterName - Optional name of the requester to display
 * @param onSuccess - Optional callback invoked when ticket is successfully created, receives the ticket number
 */
export function CreateTicket({ requesterId, requesterName, onSuccess }: CreateTicketProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/systems").then((r) => r.json()),
    ])
      .then(([cats, syss]) => {
        setCategories(cats);
        setSystems(syss);
        if (cats.length > 0) setCategoryId(String(cats[0].id));
        if (syss.length > 0) setSystemId(String(syss[0].id));
        setLoadingDropdowns(false);
      })
      .catch(() => setLoadingDropdowns(false));
  }, []);

  /**
   * Validates the form fields and returns an object containing any validation errors.
   *
   * @returns An object mapping field names to error messages
   */
  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!summary.trim()) e.summary = "Summary is required.";
    else if (summary.trim().length > 200) e.summary = "Summary must not exceed 200 characters.";
    if (!description.trim()) e.description = "Description is required.";
    else if (description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (!categoryId) e.categoryId = "Category is required.";
    if (!systemId) e.systemId = "Related system is required.";
    if (!requestedPriority) e.requestedPriority = "Priority is required.";
    return e;
  }

  /**
   * Handles form submission by validating inputs and sending ticket data to the API.
   * On success, clears the form and invokes the onSuccess callback.
   * On failure, displays validation errors or submission errors.
   *
   * @param e - The form submission event
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessTicket(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, description, categoryId: Number(categoryId), systemId: Number(systemId), requestedPriority, requesterId }),
      });

      if (res.status === 201) {
        const data = await res.json();
        setSuccessTicket(data.ticketNumber);
        setSummary("");
        setDescription("");
        setRequestedPriority("");
        if (onSuccess) onSuccess(data.ticketNumber);
      } else {
        const data = await res.json();
        if (data.errors) {
          const apiErrors: FormErrors = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            (apiErrors as Record<string, string>)[err.field] = err.message;
          });
          setErrors(apiErrors);
        } else {
          setSubmitError(data.error || "Submission failed.");
        }
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const zen = "#006B3C";

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <div className="card shadow-sm" style={{ borderTop: `4px solid ${zen}` }}>
        <div className="card-body">
          <h4 className="card-title mb-1" style={{ color: zen }}>
            Create IT Support Ticket
          </h4>
          {requesterName && (
            <p className="text-muted small mb-4">
              Submitting as: <strong>{requesterName}</strong>
            </p>
          )}

          {successTicket && (
            <div className="alert alert-success" data-testid="success-message">
              ✅ Ticket created! Your ticket number is <strong>{successTicket}</strong>.
            </div>
          )}
          {submitError && (
            <div className="alert alert-danger" data-testid="submit-error">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate data-testid="create-ticket-form">
            <div className="row g-3">
              {/* Summary */}
              <div className="col-12">
                <label htmlFor="summary" className="form-label fw-semibold">
                  Summary <span className="text-danger">*</span>
                </label>
                <input
                  id="summary"
                  type="text"
                  className={`form-control ${errors.summary ? "is-invalid" : ""}`}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of the issue (max 200 chars)"
                  data-testid="input-summary"
                />
                {errors.summary && (
                  <div className="invalid-feedback" data-testid="error-summary">
                    {errors.summary}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="col-12">
                <label htmlFor="description" className="form-label fw-semibold">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="description"
                  className={`form-control ${errors.description ? "is-invalid" : ""}`}
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail (min 20 chars)"
                  data-testid="input-description"
                />
                {errors.description && (
                  <div className="invalid-feedback" data-testid="error-description">
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="col-12 col-md-6">
                <label htmlFor="categoryId" className="form-label fw-semibold">
                  Category <span className="text-danger">*</span>
                </label>
                <select
                  id="categoryId"
                  className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  data-testid="select-category"
                  disabled={loadingDropdowns}
                >
                  {loadingDropdowns ? (
                    <option>Loading...</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.categoryId && (
                  <div className="invalid-feedback" data-testid="error-category">
                    {errors.categoryId}
                  </div>
                )}
              </div>

              {/* Related System */}
              <div className="col-12 col-md-6">
                <label htmlFor="systemId" className="form-label fw-semibold">
                  Related System <span className="text-danger">*</span>
                </label>
                <select
                  id="systemId"
                  className={`form-select ${errors.systemId ? "is-invalid" : ""}`}
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                  data-testid="select-system"
                  disabled={loadingDropdowns}
                >
                  {loadingDropdowns ? (
                    <option>Loading...</option>
                  ) : (
                    systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.systemId && (
                  <div className="invalid-feedback" data-testid="error-system">
                    {errors.systemId}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="col-12 col-md-6">
                <label htmlFor="requestedPriority" className="form-label fw-semibold">
                  Priority <span className="text-danger">*</span>
                </label>
                <select
                  id="requestedPriority"
                  className={`form-select ${errors.requestedPriority ? "is-invalid" : ""}`}
                  value={requestedPriority}
                  onChange={(e) => setRequestedPriority(e.target.value)}
                  data-testid="select-priority"
                >
                  <option value="">-- Select Priority --</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                {errors.requestedPriority && (
                  <div className="invalid-feedback" data-testid="error-priority">
                    {errors.requestedPriority}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="col-12">
                <button
                  type="submit"
                  className="btn w-100"
                  style={{ backgroundColor: zen, color: "white", borderColor: zen }}
                  disabled={submitting}
                  data-testid="submit-btn"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
