const fs = require('fs');
let f = fs.readFileSync('client/src/App.tsx', 'utf8');

const replacement = `  if (user.mustChangePassword) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" data-testid="must-change-password-alert">
          <h4>Security Alert</h4>
          <p>You must change your temporary password before accessing the system.</p>
          <small className="text-muted">(Password change UI is pending implementation)</small>
          <br/>
          <button className="btn btn-outline-danger mt-3" onClick={() => { localStorage.removeItem("token"); setUser(null); }}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">`;

f = f.replace(/  return \(\r?\n    <div className="container mt-3">/, replacement);

fs.writeFileSync('client/src/App.tsx', f);
