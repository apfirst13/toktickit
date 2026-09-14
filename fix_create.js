const fs = require('fs');
let t = fs.readFileSync('client/src/components/CreateTicket.tsx', 'utf8');
t = t.replace(
  'headers: { "Content-Type": "application/json" },',
  'headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token") || ""}` },'
);
t = t.replace(
  'requestedPriority, requesterId }),',
  'requestedPriority }),'
);
fs.writeFileSync('client/src/components/CreateTicket.tsx', t, 'utf8');
