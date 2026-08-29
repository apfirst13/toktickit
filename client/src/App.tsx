import { useState } from "react";
import { DevelopmentRequesterSelection } from "./components/DevelopmentRequesterSelection";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";

interface Requester {
  id: number;
  name: string;
}

type ViewState = "CREATE" | "LIST" | "DETAIL";

/**
 * Main application component that manages requester selection and ticket creation/management workflow.
 */
function App() {
  const [requester, setRequester] = useState<Requester | null>(() => {
    const id = localStorage.getItem("dev_requester_id");
    const name = localStorage.getItem("dev_requester_name");
    return id ? { id: Number(id), name: name || "Unknown" } : null;
  });

  const [view, setView] = useState<ViewState>("CREATE");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  function handleRequesterSelected(id: number, name: string) {
    setRequester({ id, name });
    setView("CREATE");
  }

  function handleTicketCreated(ticketNumber: string) {
    // We could auto-navigate to list, but staying on create is fine too, 
    // the user can click "My Tickets" tab. For now, leave it on CREATE.
    console.log("Created", ticketNumber);
  }

  if (!requester) {
    return (
      <div className="container mt-5">
        <DevelopmentRequesterSelection onSelect={handleRequesterSelected} />
      </div>
    );
  }

  return (
    <div className="container mt-3">
      {/* Header & Tabs */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="mb-0" style={{ color: "#006B3C" }}>TokTickIT</h2>
          <span className="text-muted small">
            Acting as: <strong>{requester.name}</strong>
          </span>
        </div>
        
        <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">
          <div className="btn-group" role="group">
            <button 
              className={`btn btn-sm ${view === "CREATE" ? "btn-primary" : "btn-outline-primary"}`}
              style={view === "CREATE" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
              onClick={() => setView("CREATE")}
              data-testid="nav-create"
            >
              Create Ticket
            </button>
            <button 
              className={`btn btn-sm ${view === "LIST" || view === "DETAIL" ? "btn-primary" : "btn-outline-primary"}`}
              style={(view === "LIST" || view === "DETAIL") ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
              onClick={() => setView("LIST")}
              data-testid="nav-list"
            >
              My Tickets
            </button>
          </div>
          
          <button
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => {
              localStorage.removeItem("dev_requester_id");
              localStorage.removeItem("dev_requester_name");
              setRequester(null);
            }}
          >
            Switch User
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {view === "CREATE" && (
        <CreateTicket requesterId={requester.id} onSuccess={handleTicketCreated} />
      )}

      {view === "LIST" && (
        <MyTickets 
          requesterId={requester.id} 
          onViewTicket={(id) => {
            setSelectedTicketId(id);
            setView("DETAIL");
          }} 
        />
      )}

      {view === "DETAIL" && selectedTicketId && (
        <TicketDetail 
          ticketId={selectedTicketId} 
          requesterId={requester.id}
          onBack={() => setView("LIST")}
        />
      )}
    </div>
  );
}

export default App;
