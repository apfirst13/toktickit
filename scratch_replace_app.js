const fs = require('fs');
let f = fs.readFileSync('client/src/App.tsx', 'utf8');

f = f.replace(
  'role: string;',
  'role: string;\n  mustChangePassword?: boolean;'
);

f = f.replace(
  'role: payload.role || "REQUESTER"',
  'role: payload.role || "REQUESTER",\n          mustChangePassword: !!payload.mustChangePassword'
);

const guard = `  if (user.mustChangePassword) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" data-testid="must-change-password-alert">
          <h4>Security Alert</h4>
          <p>You must change your temporary password before accessing the system.</p>
          <small className="text-muted">(Password change UI is pending implementation)</small>
          <br/>
          <button className="btn btn-outline-danger mt-3" onClick={() => {
            localStorage.removeItem("token");
            setUser(null);
          }}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">`

f = f.replace('  return (\n    <div className="container mt-3">', guard);

fs.writeFileSync('client/src/App.tsx', f);
