/***********************
 * Mock Jobs (demo data)
 ***********************/
const JOBS = [
  {
    id: "JOB-1001",
    title: "Junior Web Developer",
    company: "TechNova Sdn Bhd",
    location: "Kuala Lumpur",
    type: "Full-time",
    salary: "RM 3,000 – RM 4,000",
    status: "OPEN",        // OPEN | CLOSED
    deadline: "2026-03-15",
    posted: "2026-02-10",
    description:
      "Build and maintain web features using HTML/CSS/JavaScript. Work with a small team and ship improvements weekly."
  },
  {
    id: "JOB-1002",
    title: "Frontend Intern",
    company: "BlueOrbit Studio",
    location: "Remote",
    type: "Internship",
    salary: "RM 1,000 – RM 1,500",
    status: "OPEN",
    deadline: "2026-03-05",
    posted: "2026-02-13",
    description:
      "Assist in building responsive UI components and improving page layouts. Great for students."
  },
  {
    id: "JOB-2002",
    title: "UI/UX Designer",
    company: "PixelWorks",
    location: "Remote",
    type: "Remote",
    salary: "RM 4,500 – RM 6,000",
    status: "CLOSED",
    deadline: "2026-02-10",
    posted: "2026-01-22",
    description:
      "Design user flows and prototypes. This job is CLOSED (included to test validation)."
  }
];

/***********************
 * Config (Apply rules)
 ***********************/
const MAX_RESUME_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_EXT = new Set(["pdf", "doc", "docx"]);

/***********************
 * Helpers
 ***********************/
const $ = (id) => document.getElementById(id);

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function extOf(name) {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase().trim();
}

function uid(prefix = "APP") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

/***********************
 * Storage
 ***********************/
function getSeekerId() {
  return sessionStorage.getItem("jobSeekerId") || "";
}

function loadApps() {
  try {
    return JSON.parse(localStorage.getItem("applications") || "[]");
  } catch {
    return [];
  }
}

function saveApps(apps) {
  localStorage.setItem("applications", JSON.stringify(apps));
}

/***********************
 * Toast
 ***********************/
function toast(type, title, msg) {
  const wrap = $("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type === "bad" ? "bad" : ""}`;
  el.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-msg">${msg}</div>
  `;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/***********************
 * Routing
 ***********************/
function showSection(hash) {
  const isApps = hash === "#applications";
  $("sectionJobs").classList.toggle("show", !isApps);
  $("sectionApplications").classList.toggle("show", isApps);

  $("navJobs").classList.toggle("active", !isApps);
  $("navApps").classList.toggle("active", isApps);
}

window.addEventListener("hashchange", () => showSection(location.hash || "#jobs"));

/***********************
 * UI: Login
 ***********************/
function updateLoginUI() {
  const id = getSeekerId();
  $("loginStatus").textContent = id ? `Signed in: ${id}` : "Not signed in";
  $("btnSignIn").style.display = id ? "none" : "inline-block";
  $("btnSignOut").style.display = id ? "inline-block" : "none";

  renderStats();
  renderApplicationsTable();
}

/***********************
 * Stats
 ***********************/
function renderStats() {
  const openCount = JOBS.filter(j => j.status === "OPEN").length;
  const companyCount = new Set(JOBS.map(j => j.company)).size;

  const seekerId = getSeekerId();
  const yourApps = seekerId ? loadApps().filter(a => a.seekerId === seekerId).length : 0;

  $("statOpen").textContent = openCount;
  $("statCompanies").textContent = companyCount;
  $("statApps").textContent = yourApps;
}

/***********************
 * Jobs: list + detail
 ***********************/
let filteredJobs = [...JOBS];
let selectedJobId = JOBS[0].id;

function jobRow(job) {
  const badgeClass = job.status === "OPEN" ? "open" : "closed";
  const badgeText = job.status === "OPEN" ? "OPEN" : "CLOSED";
  return `
    <div class="job" data-job="${job.id}">
      <div>
        <div class="job-title">${job.title}</div>
        <div class="job-meta">${job.company} • ${job.location} • ${job.type}</div>
        <div class="job-meta">Deadline: ${job.deadline}</div>
      </div>
      <div class="badge ${badgeClass}">${badgeText}</div>
    </div>
  `;
}

function renderJobList() {
  const el = $("jobList");
  if (filteredJobs.length === 0) {
    el.innerHTML = `<div class="muted">No jobs found.</div>`;
    return;
  }

  el.innerHTML = filteredJobs.map(jobRow).join("");

  el.querySelectorAll(".job").forEach(card => {
    card.addEventListener("click", () => {
      selectedJobId = card.dataset.job;
      renderJobDetail();
    });
  });
}

function renderJobDetail() {
  const job = JOBS.find(j => j.id === selectedJobId);
  if (!job) return;

  const badgeClass = job.status === "OPEN" ? "open" : "closed";
  const badgeText = job.status === "OPEN" ? "OPEN" : "CLOSED";

  $("jobDetail").innerHTML = `
    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
      <div>
        <h3 class="detail-title">${job.title}</h3>
        <div class="detail-sub">${job.company} • ${job.location} • ${job.type}</div>
        <div class="detail-sub">Today: ${todayISO()} • Deadline: ${job.deadline}</div>
      </div>
      <div class="badge ${badgeClass}">${badgeText}</div>
    </div>

    <div class="detail-grid">
      <div class="info">
        <div class="info-k">Job ID</div>
        <div class="info-v">${job.id}</div>
      </div>
      <div class="info">
        <div class="info-k">Salary</div>
        <div class="info-v">${job.salary}</div>
      </div>
      <div class="info">
        <div class="info-k">Posted</div>
        <div class="info-v">${job.posted}</div>
      </div>
      <div class="info">
        <div class="info-k">Status</div>
        <div class="info-v">${job.status}</div>
      </div>
    </div>

    <div class="box">${job.description}</div>

    <div class="actions">
      <button class="btn btn-primary" id="btnApplyNow">Apply Now</button>
      <a class="btn btn-outline" href="#applications">View My Applications</a>
    </div>
  `;

  $("btnApplyNow").addEventListener("click", () => openApply(job));
}

/***********************
 * Apply: validation + save
 ***********************/
let applyJob = null;

function applyValidation({ seekerId, job, file }) {
  // Login required
  if (!seekerId || !seekerId.trim()) {
    return { ok: false, error: "You must sign in before applying." };
  }

  // Job must be OPEN
  if (!job) return { ok: false, error: "Job not found." };
  if (job.status !== "OPEN") {
    return { ok: false, error: "This job is not open for applications." };
  }

  // Deadline must not be passed
  const today = todayISO();
  if (job.deadline && job.deadline < today) {
    return { ok: false, error: "Application deadline has passed." };
  }

  // Resume required
  if (!file) return { ok: false, error: "Resume is required." };
  if (!file.name || typeof file.size !== "number" || file.size <= 0) {
    return { ok: false, error: "Invalid resume file." };
  }

  // File type + size
  if (file.size > MAX_RESUME_BYTES) {
    return { ok: false, error: "Resume file too large (max 2MB)." };
  }
  const ext = extOf(file.name);
  if (!ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "Unsupported resume format. Use PDF/DOC/DOCX." };
  }

  // Duplicate check
  const apps = loadApps();
  const duplicate = apps.some(a => a.jobId === job.id && a.seekerId === seekerId && a.status !== "WITHDRAWN");
  if (duplicate) {
    return { ok: false, error: "You have already applied for this job." };
  }

  return { ok: true };
}

function applyForJob({ seekerId, job, file, coverLetter }) {
  const check = applyValidation({ seekerId, job, file });
  if (!check.ok) return check;

  const apps = loadApps();
  const newApp = {
    id: uid("APP"),
    seekerId,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    type: job.type,
    resumeName: file.name,
    resumeSize: file.size,
    coverLetter: coverLetter || "",
    appliedAt: new Date().toISOString(),
    status: "SUBMITTED"
  };

  apps.push(newApp);
  saveApps(apps);

  return { ok: true, application: newApp };
}

/***********************
 * Applications table
 ***********************/
function renderApplicationsTable() {
  const seekerId = getSeekerId();
  const wrap = $("appsWrap");

  if (!seekerId) {
    wrap.className = "muted";
    wrap.textContent = "Please sign in to view your applications.";
    return;
  }

  const apps = loadApps()
    .filter(a => a.seekerId === seekerId)
    .sort((a,b) => (b.appliedAt || "").localeCompare(a.appliedAt || ""));

  if (apps.length === 0) {
    wrap.className = "muted";
    wrap.textContent = "No applications yet. Go to Jobs and apply.";
    return;
  }

  wrap.className = "table-wrap";
  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Job</th>
          <th>Status</th>
          <th>Applied</th>
          <th>Resume</th>
        </tr>
      </thead>
      <tbody>
        ${apps.map(a => `
          <tr>
            <td>
              <div style="font-weight:900;">${a.jobTitle}</div>
              <div class="muted">${a.company} • ${a.location} • ${a.type}</div>
              <div class="muted">Job ID: ${a.jobId}</div>
            </td>
            <td>${a.status}</td>
            <td>${new Date(a.appliedAt).toLocaleString()}</td>
            <td>${a.resumeName}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  renderStats();
}

/***********************
 * Modals
 ***********************/
function openOverlay(id){ $(id).classList.add("show"); }
function closeOverlay(id){ $(id).classList.remove("show"); }

function openSignIn(){
  $("inputSeekerId").value = getSeekerId() || "";
  openOverlay("overlaySignIn");
  $("inputSeekerId").focus();
}

function openApply(job){
  if (!getSeekerId()){
    toast("bad", "Sign in required", "Please sign in before applying.");
    openSignIn();
    return;
  }

  applyJob = job;
  $("applyJobSummary").innerHTML = `
    <b>${job.title}</b><br/>
    <span class="muted">${job.company} • ${job.location} • Deadline: ${job.deadline}</span>
  `;
  $("resumeFile").value = "";
  $("coverLetter").value = "";
  $("applyInlineMsg").innerHTML = "";
  openOverlay("overlayApply");
}

function setApplyMsg(type, text){
  const el = $("applyInlineMsg");
  const color = (type === "bad") ? "#dc2626" : "#2563eb";
  const bg = (type === "bad") ? "rgba(220,38,38,.06)" : "rgba(37,99,235,.08)";
  el.innerHTML = `
    <div class="box" style="border-color:${color}33;background:${bg};">
      <b style="color:${color};">${text}</b>
    </div>
  `;
}

/***********************
 * Search
 ***********************/
function runSearch(){
  const kw = $("qKeyword").value.trim().toLowerCase();
  const loc = $("qLocation").value.trim().toLowerCase();
  const type = $("qType").value.trim();

  filteredJobs = JOBS.filter(j => {
    const okKw = !kw || j.title.toLowerCase().includes(kw) || j.company.toLowerCase().includes(kw);
    const okLoc = !loc || j.location.toLowerCase().includes(loc);
    const okType = !type || j.type === type;
    return okKw && okLoc && okType;
  });

  if (!filteredJobs.some(j => j.id === selectedJobId)){
    selectedJobId = filteredJobs[0]?.id || JOBS[0].id;
  }

  renderJobList();
  renderJobDetail();
  toast("ok", "Search updated", `Found ${filteredJobs.length} job(s).`);
}

/***********************
 * Wire events
 ***********************/
$("btnSearch").addEventListener("click", runSearch);

$("btnSignIn").addEventListener("click", openSignIn);
$("btnSignOut").addEventListener("click", () => {
  sessionStorage.removeItem("jobSeekerId");
  updateLoginUI();
  toast("ok", "Signed out", "You are now signed out.");
});

$("closeSignIn").addEventListener("click", () => closeOverlay("overlaySignIn"));
$("cancelSignIn").addEventListener("click", () => closeOverlay("overlaySignIn"));
$("confirmSignIn").addEventListener("click", () => {
  const id = $("inputSeekerId").value.trim();
  if (!id){
    toast("bad", "Missing ID", "Please enter a Job Seeker ID.");
    return;
  }
  sessionStorage.setItem("jobSeekerId", id);
  closeOverlay("overlaySignIn");
  updateLoginUI();
  toast("ok", "Signed in", `Welcome, ${id}.`);
});

$("closeApply").addEventListener("click", () => closeOverlay("overlayApply"));
$("clearApply").addEventListener("click", () => {
  $("resumeFile").value = "";
  $("coverLetter").value = "";
  $("applyInlineMsg").innerHTML = "";
});

$("submitApply").addEventListener("click", () => {
  if (!applyJob) return;

  const seekerId = getSeekerId();
  const file = $("resumeFile").files && $("resumeFile").files[0] ? $("resumeFile").files[0] : null;
  const cover = $("coverLetter").value;

  const result = applyForJob({ seekerId, job: applyJob, file, coverLetter: cover });

  if (!result.ok){
    setApplyMsg("bad", result.error);
    toast("bad", "Application failed", result.error);
    return;
  }

  setApplyMsg("ok", "Application submitted successfully! Status: SUBMITTED");
  toast("ok", "Submitted", `Applied to "${applyJob.title}".`);
  renderApplicationsTable();

  setTimeout(() => closeOverlay("overlayApply"), 600);
});

// Close modal when clicking outside modal box
["overlaySignIn","overlayApply"].forEach(id => {
  $(id).addEventListener("click", (e) => {
    if (e.target.id === id) closeOverlay(id);
  });
});

/***********************
 * Init
 ***********************/
function init(){
  showSection(location.hash || "#jobs");
  renderJobList();
  renderJobDetail();
  updateLoginUI();
  renderStats();
  renderApplicationsTable();
}
init();