const fs = require('fs');
let cRoute = fs.readFileSync('server/src/routes/tickets.routes.ts', 'utf8');
cRoute = cRoute.split('\n');
cRoute[26] = '    cb(null, \\);';
fs.writeFileSync('server/src/routes/tickets.routes.ts', cRoute.join('\n'), 'utf8');
