// 1. Generate Dummy Data (15 applications to test pagination)
const statuses = ["SUBMITTED", "UNDER REVIEW", "INTERVIEW", "REJECTED"];
let dummyApplications = [];

for (let i = 1; i <= 15; i++) {
  // Generate fake dates spanning the last 15 days
  let date = new Date();
  date.setDate(date.getDate() - i); 
  
  dummyApplications.push({
    id: `APP-100${i}`,
    jobTitle: i % 2 === 0 ? "Junior Web Developer" : "Software Engineering Intern",
    company: i % 3 === 0 ? "TechNova Sdn Bhd" : "BlueOrbit Studio",
    location: "Kuala Lumpur",
    type: "Full-time",
    appliedAt: date.toISOString(),
    status: statuses[i % statuses.length],
    resumeName: "My_Resume_Final.pdf",
    coverLetter: "I am writing to express my strong interest in this position. I believe my skills make me a great fit."
  });
}

// Ensure they are sorted by date (newest first) for Acceptance Criteria 4
dummyApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

// 2. Pagination Variables
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
const $ = (id) => document.getElementById(id);

// 3. Render the Table
function renderTable() {
  const wrap = $("appsWrap");
  
  const totalPages = Math.ceil(dummyApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApps = dummyApplications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Build the table rows
  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Company</th>
          <th>Date Applied</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${paginatedApps.map(app => {
          let badgeClass = app.status === 'INTERVIEW' ? 'interview' : 
                           app.status === 'REJECTED' ? 'rejected' : '';
          return `
          <tr class="clickable-row" data-id="${app.id}">
            <td style="font-weight:900;">${app.jobTitle}</td>
            <td>${app.company}</td>
            <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
            <td><span class="status-badge ${badgeClass}">${app.status}</span></td>
          </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  // Attach click events to open modal
  document.querySelectorAll(".clickable-row").forEach(row => {
    row.addEventListener("click", () => openApplicationDetails(row.getAttribute("data-id")));
  });

  updatePaginationControls(totalPages);
}

// 4. Modal Logic
function openApplicationDetails(appId) {
  const app = dummyApplications.find(a => a.id === appId);
  if (!app) return;

  $("appDetailsContent").innerHTML = `
    <div class="detail-group">
      <span class="detail-label">Application ID</span>
      <span class="detail-value">${app.id}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Job Title</span>
      <span class="detail-value">${app.jobTitle} (${app.type})</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Company & Location</span>
      <span class="detail-value">${app.company} - ${app.location}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Application Status</span>
      <span class="detail-value status-badge">${app.status}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Date Applied</span>
      <span class="detail-value">${new Date(app.appliedAt).toLocaleString()}</span>
    </div>
    <div class="detail-group">
      <span class="detail-label">Attached Resume</span>
      <span class="detail-value">${app.resumeName}</span>
    </div>
    <div class="detail-group" style="border-bottom: none;">
      <span class="detail-label">Cover Letter</span>
      <span class="detail-value">${app.coverLetter}</span>
    </div>
  `;
  
  $("overlayAppDetails").classList.add("show");
}

// 5. Pagination Logic
function updatePaginationControls(totalPages) {
  const pageWrap = $("paginationWrap");
  pageWrap.style.display = "flex";
  $("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
  
  $("btnPrev").disabled = currentPage === 1;
  $("btnNext").disabled = currentPage === totalPages;
}

$("btnPrev").addEventListener("click", () => {
  if (currentPage > 1) { currentPage--; renderTable(); }
});

$("btnNext").addEventListener("click", () => {
  const totalPages = Math.ceil(dummyApplications.length / ITEMS_PER_PAGE);
  if (currentPage < totalPages) { currentPage++; renderTable(); }
});

// 6. Modal Close Events
$("closeAppDetails").addEventListener("click", () => {
  $("overlayAppDetails").classList.remove("show");
});

$("overlayAppDetails").addEventListener("click", (e) => {
  if (e.target.id === "overlayAppDetails") {
    $("overlayAppDetails").classList.remove("show");
  }
});

// Run automatically on load
renderTable();