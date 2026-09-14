const fs = require('fs');

let cRoute = fs.readFileSync('server/src/routes/tickets.routes.ts', 'utf8');
cRoute = cRoute.replace(/\\\\\\$\\{crypto\.randomUUID\(\)\\}\\\$\\{path\.extname\(file\.originalname\)\\}\\\/g, '\${crypto.randomUUID()}\');
fs.writeFileSync('server/src/routes/tickets.routes.ts', cRoute, 'utf8');

let cCtrl = fs.readFileSync('server/src/controllers/tickets.controller.ts', 'utf8');
cCtrl = cCtrl.replace(/\\\\/uploads\/\\\$\\{req\.file\.filename\\}\\\/g, '\/uploads/\');
cCtrl = cCtrl.replace(/\\\ttachment; filename=\\"\\\$\\{attachment\.fileName\\}\\"\\\/g, '\ttachment; filename=""\');
fs.writeFileSync('server/src/controllers/tickets.controller.ts', cCtrl, 'utf8');
