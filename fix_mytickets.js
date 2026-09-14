const fs = require('fs');
let t = fs.readFileSync('client/src/components/MyTickets.tsx', 'utf8');

t = t.replace('requesterId: String(requesterId),\n', '');
t = t.replace(
  'fetch(`/api/tickets?${query.toString()}`)',
  'fetch(`/api/tickets?${query.toString()}`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` } })'
);

fs.writeFileSync('client/src/components/MyTickets.tsx', t, 'utf8');
