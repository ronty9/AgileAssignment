(function () {
  const form = document.getElementById("invitationForm");
  const typeEl = document.getElementById("interviewType");
  const physicalBlock = document.getElementById("physicalBlock");
  const onlineBlock = document.getElementById("onlineBlock");
  const toast = document.getElementById("toast");

  const LS_KEY = "jp_interview_invitations";

  function showToast(ok, msg) {
    toast.className = "toast " + (ok ? "toast--ok" : "toast--bad");
    toast.textContent = msg;
    toast.style.display = "block";
  }

  function clearErrors() {
    document.querySelectorAll(".error").forEach(e => e.textContent = "");
    toast.style.display = "none";
    toast.className = "toast";
    toast.textContent = "";
  }

  function setError(name, msg) {
    const el = document.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = msg;
  }

  function toggleTypeFields() {
    const t = typeEl.value;
    physicalBlock.style.display = (t === "PHYSICAL") ? "flex" : "none";
    onlineBlock.style.display = (t === "ONLINE") ? "flex" : "none";
  }

  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function readInvitations() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch { return []; }
  }

  function writeInvitations(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function validate(data) {
    clearErrors();
    let ok = true;

    if (!data.interviewType) { ok = false; setError("interviewType", "Interview type is required."); }
    if (!data.interviewDate) { ok = false; setError("interviewDate", "Interview date is required."); }
    if (!data.interviewTime) { ok = false; setError("interviewTime", "Interview time is required."); }

    if (data.interviewDate && data.interviewTime) {
      const dt = new Date(`${data.interviewDate}T${data.interviewTime}:00`);
      const now = new Date();
      if (isNaN(dt.getTime())) {
        ok = false;
        setError("interviewDate", "Invalid date/time format.");
      } else if (dt.getTime() < now.getTime()) {
        ok = false;
        setError("interviewDate", "Interview date/time cannot be in the past.");
      }
    }

    if (data.interviewType === "ONLINE") {
      if (!data.meetingLink) { ok = false; setError("meetingLink", "Meeting link is required for online interview."); }
      else if (!isValidUrl(data.meetingLink)) { ok = false; setError("meetingLink", "Meeting link must be a valid URL (http/https)."); }
    }

    if (data.interviewType === "PHYSICAL") {
      if (!data.location) { ok = false; setError("location", "Location is required for physical interview."); }
    }

    return ok;
  }

  // Init
  toggleTypeFields();
  typeEl.addEventListener("change", toggleTypeFields);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      applicantName: form.applicantName.value.trim(),
      jobTitle: form.jobTitle.value.trim(),
      interviewType: form.interviewType.value,
      interviewDate: form.interviewDate.value,
      interviewTime: form.interviewTime.value,
      location: form.location.value.trim(),
      meetingLink: form.meetingLink.value.trim(),
      notes: form.notes.value.trim(),
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    if (!validate(data)) {
      showToast(false, "Please fix the errors and try again.");
      return;
    }

    const items = readInvitations();
    items.push(data);
    writeInvitations(items);

    showToast(true, "Invitation sent successfully! Redirecting...");
    form.reset();
    toggleTypeFields();

    setTimeout(() => {
      window.location.href = "./interview_invitations.html";
    }, 600);
  });

  form.addEventListener("reset", function () {
    clearErrors();
    setTimeout(toggleTypeFields, 0);
  });
})();