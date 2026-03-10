(function () {
  const SESSION_KEY = "jp_logged_in_jobseeker";
  const INV_KEY = "jp_interview_invitations";

  const listEl = document.getElementById("scheduleList");
  const emptyEl = document.getElementById("emptyState");
  const summaryBox = document.getElementById("summaryBox");
  const qEl = document.getElementById("q");
  const typeEl = document.getElementById("typeFilter");
  const statusEl = document.getElementById("statusFilter");
  const sortEl = document.getElementById("sortBy");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userMeta = document.getElementById("userMeta");
  const toast = document.getElementById("toast");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const mClose = document.getElementById("mClose");
  const mClose2 = document.getElementById("mClose2");
  const mTitle = document.getElementById("mTitle");
  const mSub = document.getElementById("mSub");
  const mBody = document.getElementById("mBody");

  function showToast(ok, msg) {
    toast.className = "toast " + (ok ? "toast--ok" : "toast--bad");
    toast.textContent = msg;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
      toast.className = "toast";
      toast.textContent = "";
    }, 2200);
  }

  function getCurrentUser() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function readInvitations() {
    const raw = localStorage.getItem(INV_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function parseInterviewDateTime(it) {
    const d = it.interviewDate || "";
    const t = it.interviewTime || "00:00";
    const dt = new Date(`${d}T${t}:00`);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function formatDateTime(it) {
    const dt = parseInterviewDateTime(it);
    if (!dt) return `${it.interviewDate || "-"} ${it.interviewTime || "-"}`;
    return dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function formatFullDateTime(it) {
    const dt = parseInterviewDateTime(it);
    if (!dt) return `${it.interviewDate || "-"} ${it.interviewTime || "-"}`;
    return dt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  }

  function badge(type) {
    return type === "ONLINE"
      ? `<span class="pill pill--online">Online</span>`
      : `<span class="pill pill--physical">Physical</span>`;
  }

  function statusBadge(status) {
    const s = (status || "PENDING").toUpperCase();
    if (s === "ACCEPTED") return `<span class="pill pill--ok">Accepted</span>`;
    if (s === "DECLINED") return `<span class="pill pill--bad">Declined</span>`;
    return `<span class="pill pill--pending">Pending</span>`;
  }

  function redirectToLogin() {
    window.location.href = "./jobseeker_login.html";
  }

  function openModal(item) {
    mTitle.textContent = item.jobTitle || "Interview Details";
    mSub.textContent = `Employer: ${item.employerName || "-"}`;

    const interviewDetail = item.interviewType === "ONLINE"
      ? `<div class="row"><span>Meeting Link</span><b>${item.meetingLink || "-"}</b></div>`
      : `<div class="row"><span>Location</span><b>${item.location || "-"}</b></div>`;

    mBody.innerHTML = `
      <div class="modalGrid">
        <div class="row"><span>Date & Time</span><b>${formatFullDateTime(item)}</b></div>
        <div class="row"><span>Type</span><b>${item.interviewType || "-"}</b></div>
        ${interviewDetail}
        <div class="row"><span>Status</span><b>${item.status || "PENDING"}</b></div>
        <div class="row row--full"><span>Notes</span><b>${item.notes ? item.notes : "-"}</b></div>
        <div class="row"><span>Last Updated</span><b>${item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}</b></div>
      </div>
    `;

    modalBackdrop.style.display = "flex";
  }

  function closeModal() {
    modalBackdrop.style.display = "none";
  }

  function render() {
    const user = getCurrentUser();
    if (!user) {
      redirectToLogin();
      return;
    }

    userMeta.textContent = `${user.name} (${user.id})`;

    const all = readInvitations();
    let myItems = all.filter(item => item.applicantId === user.id);

    const q = normalize(qEl.value);
    const tf = typeEl.value;
    const sf = statusEl.value;
    const sortMode = sortEl.value;

    if (q) {
      myItems = myItems.filter(it =>
        normalize(it.jobTitle).includes(q) ||
        normalize(it.employerName).includes(q)
      );
    }

    if (tf) {
      myItems = myItems.filter(it => it.interviewType === tf);
    }

    if (sf) {
      myItems = myItems.filter(it => (it.status || "PENDING").toUpperCase() === sf);
    }

    if (sortMode === "soonest") {
      myItems.sort((a, b) => {
        const da = parseInterviewDateTime(a);
        const db = parseInterviewDateTime(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
    }

    if (sortMode === "latest") {
      myItems.sort((a, b) => {
        const da = parseInterviewDateTime(a);
        const db = parseInterviewDateTime(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db.getTime() - da.getTime();
      });
    }

    if (sortMode === "newest") {
      myItems.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }

    const totalAll = all.filter(item => item.applicantId === user.id).length;
    const pendingCount = all.filter(item => item.applicantId === user.id && (item.status || "PENDING").toUpperCase() === "PENDING").length;
    const onlineCount = all.filter(item => item.applicantId === user.id && item.interviewType === "ONLINE").length;

    summaryBox.innerHTML = `
      <div class="summaryMiniCard">
        <span class="summaryMiniCard__label">Job Seeker</span>
        <strong>${user.name}</strong>
      </div>
      <div class="summaryMiniCard">
        <span class="summaryMiniCard__label">Total Interviews</span>
        <strong>${totalAll}</strong>
      </div>
      <div class="summaryMiniCard">
        <span class="summaryMiniCard__label">Pending</span>
        <strong>${pendingCount}</strong>
      </div>
      <div class="summaryMiniCard">
        <span class="summaryMiniCard__label">Online Interviews</span>
        <strong>${onlineCount}</strong>
      </div>
    `;

    if (myItems.length === 0) {
      emptyEl.style.display = "block";
      listEl.innerHTML = "";
      return;
    }

    emptyEl.style.display = "none";

    listEl.innerHTML = myItems.map((it, index) => {
      const detailText = it.interviewType === "ONLINE"
        ? `Meeting Link: ${it.meetingLink || "-"}`
        : `Location: ${it.location || "-"}`;

      return `
        <article class="interview-card">
          <div class="interview-card__top">
            <div>
              <div class="interview-card__title">${it.jobTitle}</div>
              <div class="interview-card__company">${it.employerName || "Employer"}</div>
            </div>

            <div class="interview-card__badges">
              ${badge(it.interviewType)}
              ${statusBadge(it.status)}
            </div>
          </div>

          <div class="interview-card__body">
            <div class="interview-row">
              <div class="interview-row__label">Date & Time</div>
              <div class="interview-row__value">${formatDateTime(it)}</div>
            </div>

            <div class="interview-row">
              <div class="interview-row__label">Interview Details</div>
              <div class="interview-row__value">${detailText}</div>
            </div>

            <div class="interview-row">
              <div class="interview-row__label">Last Updated</div>
              <div class="interview-row__value">${it.updatedAt ? new Date(it.updatedAt).toLocaleString() : "-"}</div>
            </div>
          </div>

          <div style="margin-top:14px;">
            <button class="portal-btn portal-btn--secondary" data-action="view" data-idx="${index}">View Details</button>
          </div>
        </article>
      `;
    }).join("");

    const currentItems = [...myItems];
    listEl.querySelectorAll("button[data-action='view']").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-idx"));
        const item = currentItems[idx];
        if (item) openModal(item);
      });
    });
  }

  qEl.addEventListener("input", render);
  typeEl.addEventListener("change", render);
  statusEl.addEventListener("change", render);
  sortEl.addEventListener("change", render);

  refreshBtn.addEventListener("click", () => {
    render();
    showToast(true, "Interview schedule refreshed.");
  });

  logoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
    redirectToLogin();
  });

  mClose.addEventListener("click", closeModal);
  mClose2.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  window.addEventListener("storage", function (e) {
    if (e.key === INV_KEY) {
      render();
      showToast(true, "Interview schedule updated.");
    }
  });

  render();
})();