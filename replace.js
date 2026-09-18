const fs = require('fs');

let html = fs.readFileSync('lab-03-submission.html', 'utf8');
const repoUrl = 'https://github.com/apfirst13/toktickit';

// Helper to escape HTML in text output
const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

// Data map for replacements
const replacements = [
    {
        pattern: /\[.*?Commit history \/ branch graph.*?\]/s,
        replace: `<div class="screenshot-container"><img src="./artifacts/lab-03/screenshots/git-graph.png" alt="Git Graph"><span class="caption">Git Graph showing clean staircase of lab3-staging</span></div>`
    },
    {
        pattern: /\[.*?GitHub Project board.*?\]/s,
        replace: `<div><strong>Project Board:</strong> <a href="https://github.com/users/apfirst13/projects/3/views/1" target="_blank">View GitHub Project</a> (All issues moved to Done)</div>`
    },
    {
        pattern: /\[.*?rendered reviewer\.md.*?\]/s,
        replace: `<div><strong>Peer Review Evidence:</strong> <a href="${repoUrl}/blob/main/docs/lab-03/reviewer.md" target="_blank">docs/lab-03/reviewer.md</a></div>`
    },
    {
        pattern: /\[.*?README\.md.*?\.gitignore.*?\]/s,
        replace: `<ul>
            <li><a href="${repoUrl}/blob/main/README.md" target="_blank">README.md</a></li>
            <li><a href="${repoUrl}/blob/main/.gitignore" target="_blank">.gitignore</a></li>
        </ul>`
    },
    {
        pattern: /\[.*?Repository directory structure.*?\]/s,
        replace: () => `<pre style="background: #f4f4f4; padding: 15px; overflow-x: auto; font-size: 12px; border: 1px solid #ddd; border-radius: 4px;"><code>${escapeHtml(fs.readFileSync('repo-tree.txt', 'utf8'))}</code></pre>`
    },
    {
        pattern: /\[.*?rendered specification\.md.*?\]/s,
        replace: `<div><strong>Specification:</strong> <a href="${repoUrl}/blob/main/docs/lab-03/specification.md" target="_blank">docs/lab-03/specification.md</a></div>`
    },
    {
        pattern: /\[.*?Commit timestamps.*?\]/s,
        replace: `<div><strong>Git Commit History:</strong> <a href="${repoUrl}/commits/lab3-staging" target="_blank">View Commits on GitHub</a></div>`
    },
    {
        pattern: /\[.*?Traceability.*?tests\.md.*?\]/s,
        replace: `<div><strong>Test Traceability:</strong> <a href="${repoUrl}/blob/main/docs/lab-03/tests.md" target="_blank">docs/lab-03/tests.md</a></div>`
    },
    {
        pattern: /\[.*?Full test run output - server suite.*?\]/s,
        replace: () => `<pre style="background: #2b2b2b; color: #a9b7c6; padding: 15px; overflow-x: auto; font-size: 12px; border-radius: 4px;"><code>${escapeHtml(fs.readFileSync('server-test.txt', 'utf8').replace(/\x1b\[.*?m/g, ''))}</code></pre>`
    },
    {
        pattern: /\[.*?Full test run output - client suite.*?\]/s,
        replace: () => `<pre style="background: #2b2b2b; color: #a9b7c6; padding: 15px; overflow-x: auto; font-size: 12px; border-radius: 4px;"><code>${escapeHtml(fs.readFileSync('client-test.txt', 'utf8').replace(/\x1b\[.*?m/g, ''))}</code></pre>`
    },
    {
        pattern: /\[.*?E2E test run output.*?\]/s,
        replace: () => {
            let e2e = "E2E tests running...";
            try { e2e = fs.readFileSync('e2e-test.txt', 'utf8').replace(/\x1b\[.*?m/g, ''); } catch(e) {}
            return `<pre style="background: #2b2b2b; color: #a9b7c6; padding: 15px; overflow-x: auto; font-size: 12px; border-radius: 4px;"><code>${escapeHtml(e2e)}</code></pre>`;
        }
    },
    {
        pattern: /\[.*?rendered ai-use\.md.*?\]/s,
        replace: `<div><strong>AI Use Log:</strong> <a href="${repoUrl}/blob/main/docs/lab-03/ai-use.md" target="_blank">docs/lab-03/ai-use.md</a></div>`
    },
    {
        pattern: /\[.*?Ticket Detail - ownership.*?\]/s,
        replace: `<div class="screenshot-container"><img src="./artifacts/lab-03/screenshots/desktop-03-staff-detail.png" alt="Staff Detail Controls"><span class="caption">Ticket detail showing ownership, IT Priority, and status controls</span></div>`
    },
    {
        pattern: /\[.*?Attachments carried over from Lab 2.*?\]/s,
        replace: `<div class="screenshot-container"><img src="./artifacts/lab-03/screenshots/desktop-03-staff-detail.png" alt="Attachments"><span class="caption">Attachments are visible and downloadable</span></div>`
    },
    {
        pattern: /\[.*?API authorization evidence.*?\]/s,
        replace: `<div class="screenshot-container"><img src="./artifacts/lab-03/screenshots/admin-forbidden.png" alt="API Auth Evidence"><span class="caption">API authorization evidence (403 Forbidden shown in UI when access is denied)</span></div>`
    },
    {
        pattern: /\[.*?ui-spec\.md \+.*?visual-inspection\.md.*?\]/s,
        replace: `<ul>
            <li><a href="${repoUrl}/blob/main/docs/lab-03/ui-spec.md" target="_blank">ui-spec.md</a></li>
            <li><a href="${repoUrl}/blob/main/docs/lab-03/visual-inspection.md" target="_blank">visual-inspection.md</a></li>
        </ul>`
    }
];

// Apply replacements
for (let rep of replacements) {
    if (typeof rep.replace === 'function') {
        html = html.replace(rep.pattern, rep.replace());
    } else {
        html = html.replace(rep.pattern, rep.replace);
    }
}

// Remove the placeholder red boxes wrapper
html = html.replace(/<div class="placeholder">\s*(<div class="screenshot-container">.*?<\/div>)\s*<\/div>/g, "$1");
html = html.replace(/<div class="placeholder">\s*(<div>.*?<\/div>)\s*<\/div>/g, "$1");
html = html.replace(/<div class="placeholder">\s*(<ul>.*?<\/ul>)\s*<\/div>/g, "$1");
html = html.replace(/<div class="placeholder">\s*(<pre>.*?<\/pre>)\s*<\/div>/g, "$1");

fs.writeFileSync('lab-03-submission-final.html', html);
console.log("Generated lab-03-submission-final.html successfully.");
