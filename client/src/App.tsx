import { useState, useEffect } from "react";
import { CreateTicket } from "./components/CreateTicket";
import { MyTickets } from "./components/MyTickets";
import { TicketDetail } from "./components/TicketDetail";
import { StaffTicketQueue } from "./components/StaffTicketQueue";
import { UserManagement } from "./components/UserManagement";
import { Login } from "./components/Login";
import { RequesterDashboard } from "./components/dashboard/RequesterDashboard";

interface User {
  id: number;
  fullName: string;
  role: string;
  mustChangePassword?: boolean;
}

type ViewState = "CREATE" | "LIST" | "DETAIL" | "STAFF_QUEUE" | "USERS" | "DASHBOARD";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>("CREATE");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketListFilter, setTicketListFilter] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          fullName: payload.fullName || "User",
          role: payload.role || "REQUESTER",
          mustChangePassword: !!payload.mustChangePassword
        });
      } catch (e) {
        console.error("Invalid token", e);
      }
    }
  }, []);

  function handleTicketCreated(ticketNumber: string) {
    console.log("Created", ticketNumber);
  }

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem("token", token);
    setUser({
      id: userData.id || userData.userId,
      fullName: userData.fullName || "User",
      role: userData.role || "REQUESTER",
      mustChangePassword: !!userData.mustChangePassword
    });
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.mustChangePassword) {
    // Token contains mustChangePassword=true (e.g. page refresh).
    // Redirect back to Login which handles the full change-password flow.
    localStorage.removeItem("token");
    setUser(null);
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
            {user.role === "REQUESTER" && (
              <button 
                className={`btn btn-sm ${view === "DASHBOARD" ? "btn-primary" : "btn-outline-primary"}`}
                style={view === "DASHBOARD" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
                onClick={() => setView("DASHBOARD")}
                data-testid="nav-dashboard"
              >
                Dashboard
              </button>
            )}
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
            {(user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") && (
              <button 
                className={`btn btn-sm ${view === "STAFF_QUEUE" ? "btn-primary" : "btn-outline-primary"}`}
                style={view === "STAFF_QUEUE" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
                onClick={() => setView("STAFF_QUEUE")}
                data-testid="nav-staff-queue"
              >
                Staff Queue
              </button>
            )}
            {user.role === "ADMINISTRATOR" && (
              <button 
                className={`btn btn-sm ${view === "USERS" ? "btn-primary" : "btn-outline-primary"}`}
                style={view === "USERS" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : { borderColor: "#006B3C", color: "#006B3C" }}
                onClick={() => setView("USERS")}
                data-testid="nav-users"
              >
                Users
              </button>
            )}
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

      {view === "DASHBOARD" && user.role === "REQUESTER" && (
        <RequesterDashboard 
          onCreateTicket={() => setView("CREATE")}
          onViewTicket={(id) => {
            setSelectedTicketId(id);
            setView("DETAIL");
          }}
          onNavigateToList={(statuses) => {
            setTicketListFilter(statuses);
            setView("LIST");
          }}
        />
      )}

      {view === "CREATE" && (
        <CreateTicket requesterId={user.id} onSuccess={handleTicketCreated} />
      )}

      {view === "LIST" && (
        <MyTickets 
          requesterId={user.id} 
          initialStatus={ticketListFilter}
          onViewTicket={(id) => {
            setSelectedTicketId(id);
            setView("DETAIL");
          }} 
        />
      )}

      {view === "STAFF_QUEUE" && (
        <StaffTicketQueue
          userId={user.id}
          onViewTicket={(id) => {
            setSelectedTicketId(id);
            setView("DETAIL");
          }}
        />
      )}

      {view === "USERS" && (
        <UserManagement currentUser={user} />
      )}

      {view === "DETAIL" && selectedTicketId && (
        <TicketDetail 
          ticketId={selectedTicketId} 
          currentUser={user}
          onBack={() => {
            if (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR") {
              setView("STAFF_QUEUE");
            } else {
              setView("LIST");
            }
          }}
        />
      )}
    </div>
  );
}
