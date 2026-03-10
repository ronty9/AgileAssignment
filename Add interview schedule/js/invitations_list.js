(function () {
  const LS_KEY = "jp_interview_invitations";

  const listEl = document.getElementById("list");
  const emptyEl = document.getElementById("emptyState");
  const qEl = document.getElementById("q");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortBy");
  const clearAllBtn = document.getElementById("clearAll");
  const toast = document.getElementById("toast");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const mClose = document.getElementById("mClose");
  const mClose2 = document.getElementById("mClose2");
  const mDelete = document.getElementById("mDelete");
  const mTitle = document.getElementById("mTitle");
  const mSub = document.getElementById("mSub");
  const mBody = document.getElementById("mBody");

  let currentIndex = null;

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

  function read() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
  }

  function write(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function parseInterviewDateTime(it) {
    // it.interviewDate: YYYY-MM-DD, it.interviewTime: HH:mm
    const d = it.interviewDate || "";
    const t = it.interviewTime || "00:00";
    const dt = new Date(`${d}T${t}:00`);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function badge(type) {
    return type === "ONLINE"
      ? `<span class="pill pill--online">Online</span>`
      : `<span class="pill pill--physical">Physical</span>`;
  }

  function statusBadge(status) {
    const s = normalize(status || "PENDING");
    if (s === "accepted") return `<span class="pill pill--ok">Accepted</span>`;
    if (s === "declined") return `<span class="pill pill--bad">Declined</span>`;
    return `<span class="pill pill--pending">Pending</span>`;
  }

  function render() {
    const items = read();

    const q = normalize(qEl.value);
    const tf = typeEl.value;

    let filtered = items.map((x, idx) => ({...x, __idx: idx}));

    if (q) {
      filtered = filtered.filter(it =>
        normalize(it.applicantName).includes(q) ||
        normalize(it.jobTitle).includes(q)
      );
    }
    if (tf) {
      filtered = filtered.filter(it => it.interviewType === tf);
    }

    // sorting
    const mode = sortEl.value;
    if (mode === "newest") filtered.sort((a,b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (mode === "oldest") filtered.sort((a,b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    if (mode === "soonest") {
      filtered.sort((a,b) => {
        const da = parseInterviewDateTime(a);
        const db = parseInterviewDateTime(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.getTime() - db.getTime();
      });
    }

    if (items.length === 0) {
      emptyEl.style.display = "block";
      listEl.innerHTML = "";
      return;
    }
    emptyEl.style.display = "none";

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="emptyInline">
          <div class="emptyInline__icon">🔎</div>
          <div>
            <div class="emptyInline__title">No results</div>
            <div class="emptyInline__sub">Try a different search or filter.</div>
          </div>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered.map(it => {
      const dt = parseInterviewDateTime(it);
      const pretty = dt
        ? dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
        : `${it.interviewDate || "-"} ${it.interviewTime || "-"}`;

      const main = it.interviewType === "ONLINE"
        ? (it.meetingLink ? `Link: ${it.meetingLink}` : "Link: -")
        : (it.location ? `Location: ${it.location}` : "Location: -");

      return `
        <article class="cardMini" data-idx="${it.__idx}">
          <div class="cardMini__top">
            <div class="cardMini__title">
              ${it.jobTitle || "Untitled Job"}
              ${badge(it.interviewType)}
            </div>
            ${statusBadge(it.status)}
          </div>

          <div class="cardMini__meta">
            <div><span class="k">Applicant</span><span class="v">${it.applicantName || "-"}</span></div>
            <div><span class="k">When</span><span class="v">${pretty}</span></div>
            <div><span class="k">Details</span><span class="v">${main}</span></div>
          </div>

          <div class="cardMini__actions">
            <button class="btn btn--soft btn--sm" data-action="view" data-idx="${it.__idx}">View</button>
            <button class="btn btn--ghost btn--sm" data-action="delete" data-idx="${it.__idx}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function openModal(item, idx) {
    currentIndex = idx;

    const dt = parseInterviewDateTime(item);
    const pretty = dt
      ? dt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })
      : `${item.interviewDate || "-"} ${item.interviewTime || "-"}`;

    mTitle.textContent = item.jobTitle || "Interview Invitation";
    mSub.textContent = `Applicant: ${item.applicantName || "-"}`;

    const details = item.interviewType === "ONLINE"
      ? `<div class="row"><span>Type</span><b>Online</b></div>
         <div class="row"><span>Meeting Link</span><b>${item.meetingLink || "-"}</b></div>`
      : `<div class="row"><span>Type</span><b>Physical</b></div>
         <div class="row"><span>Location</span><b>${item.location || "-"}</b></div>`;

    mBody.innerHTML = `
      <div class="modalGrid">
        <div class="row"><span>Date & Time</span><b>${pretty}</b></div>
        ${details}
        <div class="row"><span>Status</span><b>${(item.status || "PENDING")}</b></div>
        <div class="row row--full"><span>Notes</span><b>${item.notes ? item.notes : "-"}</b></div>
      </div>
    `;

    modalBackdrop.style.display = "flex";
  }

  function closeModal() {
    modalBackdrop.style.display = "none";
    currentIndex = null;
  }

  function deleteByIndex(idx) {
    const items = read();
    if (idx < 0 || idx >= items.length) return;
    items.splice(idx, 1);
    write(items);
    showToast(true, "Invitation deleted.");
    render();
  }

  function clearAll() {
    localStorage.removeItem(LS_KEY);
    showToast(true, "All invitations cleared.");
    render();
  }

  // Events
  qEl.addEventListener("input", render);
  typeEl.addEventListener("change", render);
  sortEl.addEventListener("change", render);

  clearAllBtn.addEventListener("click", () => {
    if (confirm("Clear all invitations?")) clearAll();
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const idx = Number(btn.getAttribute("data-idx"));

    const items = read();
    const item = items[idx];
    if (!item) return;

    if (action === "view") openModal(item, idx);
    if (action === "delete") {
      if (confirm("Delete this invitation?")) deleteByIndex(idx);
    }
  });

  mClose.addEventListener("click", closeModal);
  mClose2.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  mDelete.addEventListener("click", () => {
    if (currentIndex === null) return;
    if (confirm("Delete this invitation?")) {
      deleteByIndex(currentIndex);
      closeModal();
    }
  });

  // Init
  render();
})();