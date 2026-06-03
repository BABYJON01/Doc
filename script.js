const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/DashboardLayout.jsx', 'utf8');

// Define isDarkUI and change bg constants
code = code.replace(
    "const bgClass = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';",
    "const isDarkUI = role === 'student' || theme === 'dark';\n    const bgClass = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';"
);
code = code.replace(
    "const sidebarBg = theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200 shadow-sm';",
    "const sidebarBg = isDarkUI ? 'bg-[#0f172a] border-r border-slate-800/50 text-slate-200' : 'bg-white border-r border-slate-200 shadow-sm';"
);
code = code.replace(
    "const headerBg = theme === 'dark' ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-slate-200 shadow-sm';",
    "const headerBg = isDarkUI ? 'bg-[#0f172a]/95 border-b border-slate-800/50 text-slate-200 backdrop-blur-xl' : 'bg-white/80 border-b border-slate-200 shadow-sm';"
);

// Split code to isolate Sidebar and Header
const mainStart = code.indexOf('<main className="flex-1');
let sidebarSection = code.substring(0, mainStart);
const mainSection = code.substring(mainStart);

// We should NOT replace the theme === 'dark' inside the role-based background!
// The role-based background is in the sidebarSection before the actual <aside>
const asideStart = sidebarSection.indexOf('<aside className=');
const preAside = sidebarSection.substring(0, asideStart);
let asideOnly = sidebarSection.substring(asideStart);

asideOnly = asideOnly.replace(/theme === 'dark'/g, 'isDarkUI');

// For header, find where it ends
const headerEnd = mainSection.indexOf('</header>') + 9;
let headerSection = mainSection.substring(0, headerEnd);
const restSection = mainSection.substring(headerEnd);

headerSection = headerSection.replace(/theme === 'dark'/g, 'isDarkUI');

// Combine
let newCode = preAside + asideOnly + headerSection + restSection;

fs.writeFileSync('frontend/src/components/DashboardLayout.jsx', newCode);
console.log('Success');
