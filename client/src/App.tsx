import { useState } from "react";
import { DevelopmentRequesterSelection } from "./components/DevelopmentRequesterSelection";
import { CreateTicket } from "./components/CreateTicket";

interface Requester {
  id: number;
  name: string;
}

function App() {
  const [requester, setRequester] = useState<Requester | null>(() => {
    const id = localStorage.getItem("dev_requester_id");
    const name = localStorage.getItem("dev_requester_name");
    return id ? { id: Number(id), name: name || "Unknown" } : null;
  });

  function handleRequesterSelected(id: number, name: string) {
    setRequester({ id, name });
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
      <div className="d-flex justify-content-between align-items-center mb-3 px-2">
        <span className="text-muted small">
          Acting as: <strong>{requester.name}</strong>
        </span>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            localStorage.removeItem("dev_requester_id");
            localStorage.removeItem("dev_requester_name");
            setRequester(null);
          }}
        >
          Switch Requester
        </button>
      </div>
      <CreateTicket requesterId={requester.id} requesterName={requester.name} />
    </div>
  );
}

export default App;
