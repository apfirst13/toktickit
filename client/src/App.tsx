import { useState, useEffect } from "react";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";

interface User {
  id: number;
  fullName: string;
  role: string;
}

type ViewState = "CREATE" | "LIST" | "DETAIL";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>("CREATE");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          fullName: payload.fullName || "User",
          role: payload.role || "REQUESTER"
        });
      } catch (e) {
        console.error("Invalid token", e);
      }
    }
  }, []);

  function handleTicketCreated(ticketNumber: string) {
    console.log("Created", ticketNumber);
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>Authentication Required</h4>
          <p>Please login to continue. (Issue 4 UI pending)</p>
          <small className="text-muted">Set localStorage item 'token' with a valid JWT to simulate login.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="mb-0" style={{ color: "#006B3C" }}>TokTickIT</h2>
          <span className="text-muted small">
            Logged in as: <strong>{user.fullName}</strong> ({user.role})
          </span>
        </div>
        
        <div className="mt-3 mt-md-0 d-flex gap-2 align-items-center">
          <div className="btn-group" role="group">
            <button 
              className={`btn btn-sm ${view === "CREATE" ? "btn-primary" : "btn-outline-primary"}`}
              style={view === "CREATE" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
              onClick={() => setView("CREATE")}
            >
              Create Ticket
            </button>
            <button 
              className={`btn btn-sm ${view === "LIST" || view === "DETAIL" ? "btn-primary" : "btn-outline-primary"}`}
              style={(view === "LIST" || view === "DETAIL") ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
              onClick={() => setView("LIST")}
            >
              My Tickets
            </button>
          </div>
          
          <button
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={() => {
              localStorage.removeItem("token");
              setUser(null);
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {view === "CREATE" && (
        <CreateTicket requesterId={user.id} onSuccess={handleTicketCreated} />
      )}

      {view === "LIST" && (
        <MyTickets 
          requesterId={user.id} 
          onViewTicket={(id) => {
            setSelectedTicketId(id);
            setView("DETAIL");
          }} 
        />
      )}

      {view === "DETAIL" && selectedTicketId && (
        <TicketDetail 
          ticketId={selectedTicketId} 
          requesterId={user.id}
          onBack={() => setView("LIST")}
        />
      )}
    </div>
  );
}
