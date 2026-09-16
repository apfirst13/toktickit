import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketDetail } from "../../components/TicketDetail";

const TICKET_DATA = {
  id: 1,
  ticketNumber: "TIK-001001",
  summary: "Projector not working in Room 101",
  description: "The projector in Room 101 has not turned on since Monday morning.",
  currentStatus: "New",
  requestedPriority: "High",
  category: { name: "Hardware" },
  relatedSystem: { name: "AV System" },
  createdAt: new Date().toISOString(),
  attachments: [],
  requesterUserId: 1,
};

const mockOnBack = vi.fn();

describe("TicketDetail Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnBack.mockClear();
  });

  // ── Renders loading then ticket data ───────────────────────────────────────

  it("should show spinner then render ticket info on success", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TICKET_DATA),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    expect(screen.getByTestId("detail-loading")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument());
    expect(screen.getByTestId("detail-number")).toHaveTextContent("TIK-001001");
    expect(screen.getByTestId("detail-summary")).toHaveTextContent("Projector not working in Room 101");
    expect(screen.getByTestId("detail-category")).toHaveTextContent("Hardware");
    expect(screen.getByTestId("detail-system")).toHaveTextContent("AV System");
    expect(screen.getByTestId("detail-priority")).toHaveTextContent("High");
  });

  it("should show error alert when fetch fails", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: "Forbidden" }),
    });

    render(<TicketDetail ticketId={99} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("detail-error")).toBeInTheDocument());
    expect(screen.getByTestId("detail-error")).toHaveTextContent("Access denied.");
  });

  // ── Attachment section rendering ───────────────────────────────────────────

  it("should show 'no attachments' when list is empty", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...TICKET_DATA, attachments: [] }),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("no-attachments")).toBeInTheDocument());
    expect(screen.getByTestId("upload-form")).toBeInTheDocument();
  });

  it("should render attachment list with Download and Remove buttons", async () => {
    const attachments = [
      { id: 10, fileName: "error.jpg", fileUrl: "/uploads/err.jpg", fileType: "image/jpeg", fileSize: 20480, isRemoved: false },
      { id: 11, fileName: "report.pdf", fileUrl: "/uploads/rpt.pdf", fileType: "application/pdf", fileSize: 51200, isRemoved: false },
    ];

    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...TICKET_DATA, attachments }),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("attachment-list")).toBeInTheDocument());

    expect(screen.getByTestId("attachment-item-10")).toBeInTheDocument();
    expect(screen.getByTestId("attachment-item-11")).toBeInTheDocument();
    expect(screen.getByTestId("download-attach-10")).toBeInTheDocument();
    expect(screen.getByTestId("remove-attach-11")).toBeInTheDocument();
  });

  it("should show max-attachment warning when 5 attachments exist", async () => {
    const attachments = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      fileName: `file${i}.jpg`,
      fileUrl: `/uploads/f${i}.jpg`,
      fileType: "image/jpeg",
      fileSize: 1024,
      isRemoved: false,
    }));

    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...TICKET_DATA, attachments }),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("max-attach-warning")).toBeInTheDocument());
    expect(screen.queryByTestId("upload-form")).not.toBeInTheDocument();
  });

  // ── Client-side file validation ────────────────────────────────────────────

  it("should show error when selecting a file with invalid MIME type", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TICKET_DATA),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("upload-form")).toBeInTheDocument());

    const fileInput = screen.getByTestId("file-input");
    const badFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    await waitFor(() => expect(screen.getByTestId("upload-error")).toBeInTheDocument());
    expect(screen.getByTestId("upload-error")).toHaveTextContent(/Invalid file type/i);
  });

  it("should show error when selecting a file over 5 MB", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TICKET_DATA),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("upload-form")).toBeInTheDocument());

    const fileInput = screen.getByTestId("file-input");
    // Create a fake 6 MB file
    const bigContent = new Uint8Array(6 * 1024 * 1024).fill(0);
    const bigFile = new File([bigContent], "big.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    await waitFor(() => expect(screen.getByTestId("upload-error")).toBeInTheDocument());
    expect(screen.getByTestId("upload-error")).toHaveTextContent(/5 MB/i);
  });

  it("should show upload-success message after a successful API call", async () => {
    let callCount = 0;
    (globalThis as any).fetch = vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 99, fileName: "ok.jpg" }),
        });
      }
      // GET ticket (initial + reload after upload)
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(TICKET_DATA),
      });
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("upload-form")).toBeInTheDocument());

    const fileInput = screen.getByTestId("file-input");
    const goodFile = new File(["data"], "ok.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [goodFile] } });

    const uploadBtn = screen.getByTestId("upload-btn");
    fireEvent.click(uploadBtn);

    await waitFor(() => expect(screen.getByTestId("upload-success")).toBeInTheDocument());
    expect(screen.getByTestId("upload-success")).toHaveTextContent(/ok\.jpg.*uploaded successfully/i);
  });

  // ── Back button ────────────────────────────────────────────────────────────

  it("should call onBack when the back button is clicked", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(TICKET_DATA),
    });

    render(<TicketDetail ticketId={1} currentUser={{ id: 1, role: "REQUESTER", fullName: "Req User" }} onBack={mockOnBack} />);
    await waitFor(() => expect(screen.getByTestId("back-btn")).toBeInTheDocument());
    fireEvent.click(screen.getByTestId("back-btn"));
    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});
