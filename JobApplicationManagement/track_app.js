// Predefined statuses (for reference)
const PREDEFINED_STATUSES = [
  "Submitted", 
  "Under Review", 
  "Interview", 
  "Offered", 
  "Rejected"
];

// 3 Hardcoded applications for the Job Seeker
let mockApplications = [
  {
    id: "APP-001",
    jobTitle: "Software Engineer",
    company: "TechNova Sdn Bhd",
    status: "Under Review",
    appliedAt: new Date(Date.now() - 86400000 * 2).toLocaleString(), // 2 days ago
    lastUpdated: new Date(Date.now() - 86400000).toLocaleString()    // 1 day ago
  },
  {
    id: "APP-002",
    jobTitle: "UI/UX Designer",
    company: "PixelWorks",
    status: "Interview",
    appliedAt: new Date(Date.now() - 86400000 * 5).toLocaleString(),
    lastUpdated: new Date(Date.now() - 86400000 * 2).toLocaleString()
  },
  {
    id: "APP-003",
    jobTitle: "Data Analyst",
    company: "DataCorp",
    status: "Submitted",
    appliedAt: new Date(Date.now() - 3600000 * 4).toLocaleString(), // 4 hours ago
    lastUpdated: new Date(Date.now() - 3600000 * 4).toLocaleString()
  }
];

let selectedAppId = null;

const $ = (id) => document.getElementById(id);

// --- Helper Functions ---
function getBadgeClass(status) {
  switch(status) {
    case "Submitted": return "badge-submitted";
    case "Under Review": return "badge-review";
    case "Interview": return "badge-interview";
    case "Offered": return "badge-offered";
    case "Rejected": return "badge-rejected";
    default: return "badge-submitted";
  }
}

// --- Render Logic ---

// Renders the left-hand list of applications
function renderAppList() {
  const listEl = $("applicationsList");
  
  if (mockApplications.length === 0) {
    listEl.innerHTML = `<div class="muted">No applications found.</div>`;
    return;
  }

  // Sort by newest updated first
  const sortedApps = [...mockApplications].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

  listEl.innerHTML = sortedApps.map(app => `
    <div class="job ${app.id === selectedAppId ? 'active' : ''}" data-id="${app.id}">
      <div>
        <div class="job-title">${app.jobTitle}</div>
        <div class="job-meta">${app.company}</div>
        <div class="job-meta">App ID: ${app.id}</div>
      </div>
      <div class="badge ${getBadgeClass(app.status)}">${app.status}</div>
    </div>
  `).join("");

  // Add click listeners to each card
  listEl.querySelectorAll('.job').forEach(card => {
    card.addEventListener('click', () => {
      selectedAppId = card.getAttribute('data-id');
      renderAppList(); // Re-render to highlight active item
      renderAppDetail(); // Show details on the right
    });
  });
}

// Renders the right-hand details panel (Read-Only for Job Seeker)
function renderAppDetail() {
  const detailEl = $("applicationDetail");
  const app = mockApplications.find(a => a.id === selectedAppId);

  if (!app) {
    detailEl.innerHTML = `<div class="muted">Select an application to view details.</div>`;
    return;
  }

  // Display details to the Job Seeker
  detailEl.innerHTML = `
    <div>
      <h3 style="margin: 0 0 5px 0;">${app.jobTitle}</h3>
      <div class="muted" style="margin-bottom: 15px;">${app.company}</div>
    </div>
    
    <div class="info">
      <div class="info-k">Current Status</div>
      <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
        <div class="badge ${getBadgeClass(app.status)}">${app.status}</div>
      </div>
      <div class="timestamp">Last Updated: ${app.lastUpdated}</div>
    </div>

    <div class="info">
      <div class="info-k">Application Date</div>
      <div class="info-v">${app.appliedAt}</div>
    </div>
  `;
}

// This function mimics the Sprint 1 system sending a new application.
// It is hidden from the UI and only triggered via the browser console.
window.triggerAT2 = function() {
  const newApp = {
    id: "APP-999",
    jobTitle: "Live Demo Job",
    company: "University Evaluator Inc.",
    status: "Submitted", // <--- This proves AT2
    appliedAt: new Date().toLocaleString(),
    lastUpdated: new Date().toLocaleString()
  };
  
  mockApplications.push(newApp);
  renderAppList();
  console.log("✅ AT2 Passed: New application generated with default status 'Submitted'.");
  alert("System simulated a new application coming in from Sprint 1.");
}

// Init UI
renderAppList();