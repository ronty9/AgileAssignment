const DB_STORAGE_KEY = "jp_interview_module_db";
const SESSION_STORAGE_KEY = "jp_interview_module_session";

const state = {
  db: null,
  session: null,
  toastTimer: null
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    state.db = await loadDatabase();

    const page = document.body.dataset.page;

    if (page === "login") {
      initLoginPage();
    } else if (page === "main") {
      initMainPage();
    }
  } catch (error) {
    console.error(error);
    alert(
      "Unable to load db.json.\nPlease run this project using VS Code Live Server or another local server."
    );
  }
});

async function loadDatabase() {
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  const response = await fetch("../database/db.json");
  if (!response.ok) {
    throw new Error("Failed to load db.json");
  }

  const data = await response.json();
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
  return data;
}

function saveDatabase() {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state.db));
}

function getSession() {
  const session = localStorage.getItem(SESSION_STORAGE_KEY);
  return session ? JSON.parse(session) : null;
}

function setSession(user) {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function initLoginPage() {
  const form = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  const existingSession = getSession();
  if (existingSession && existingSession.role === "employer") {
    window.location.href = "main.html";
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    const user = state.db.users.find(
      (item) =>
        item.email.toLowerCase() === email && item.password === password
    );

    if (!user) {
      loginMessage.textContent = "Invalid email or password.";
      return;
    }

    if (user.role !== "employer") {
      loginMessage.textContent =
        "Access denied. Only a logged-in employer can create and manage interview invitations.";
      return;
    }

    setSession(user);
    loginMessage.textContent = "";
    window.location.href = "main.html";
  });
}

function initMainPage() {
  state.session = getSession();

  if (!state.session || state.session.role !== "employer") {
    clearSession();
    window.location.href = "login.html";
    return;
  }

  document.getElementById("employerName").textContent = state.session.name;

  bindMainPageEvents();
  populateApplicationOptions();
  renderInvitations();
}

function bindMainPageEvents() {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    window.location.href = "login.html";
  });

  document.getElementById("openCreateBtn").addEventListener("click", openCreateModal);
  document.getElementById("openCreateBtnTop").addEventListener("click", openCreateModal);
  document.getElementById("cancelFormBtn").addEventListener("click", closeFormModal);
  document.getElementById("closeViewBtn").addEventListener("click", closeViewModal);

  document.getElementById("searchInput").addEventListener("input", renderInvitations);
  document.getElementById("typeFilter").addEventListener("change", renderInvitations);
  document.getElementById("sortFilter").addEventListener("change", renderInvitations);

  document.getElementById("clearFiltersBtn").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("typeFilter").value = "All";
    document.getElementById("sortFilter").value = "Newest";
    renderInvitations();
  });

  document.getElementById("interviewType").addEventListener("change", toggleInterviewFields);
  document.getElementById("applicationId").addEventListener("change", updateApplicationPreview);
  document.getElementById("invitationForm").addEventListener("submit", handleInvitationSubmit);

  document.querySelectorAll("[data-close='true']").forEach((element) => {
    element.addEventListener("click", closeFormModal);
  });

  document.querySelectorAll("[data-close-view='true']").forEach((element) => {
    element.addEventListener("click", closeViewModal);
  });
}

function populateApplicationOptions(selectedId = "") {
  const select = document.getElementById("applicationId");
  const employerApps = state.db.applications.filter(
    (app) => app.employerId === state.session.id
  );

  const options = [
    `<option value="">Select job application</option>`,
    ...employerApps.map((app) => {
      const seeker = findUserById(app.jobSeekerId);
      return `<option value="${app.id}" ${selectedId === app.id ? "selected" : ""}>
        ${escapeHtml(app.jobTitle)} - ${escapeHtml(seeker ? seeker.name : "Unknown Applicant")}
      </option>`;
    })
  ];

  select.innerHTML = options.join("");
  updateApplicationPreview();
}

function updateApplicationPreview() {
  const applicationId = document.getElementById("applicationId").value;
  const application = findApplicationById(applicationId);

  const applicantEl = document.getElementById("previewApplicant");
  const jobTitleEl = document.getElementById("previewJobTitle");
  const statusEl = document.getElementById("previewStatus");

  if (!application) {
    applicantEl.textContent = "-";
    jobTitleEl.textContent = "-";
    statusEl.textContent = "Pending";
    return;
  }

  const seeker = findUserById(application.jobSeekerId);
  applicantEl.textContent = seeker ? seeker.name : "-";
  jobTitleEl.textContent = application.jobTitle;
  statusEl.textContent = "Pending";
}

function toggleInterviewFields() {
  const type = document.getElementById("interviewType").value;
  const onlineField = document.getElementById("onlineField");
  const physicalField = document.getElementById("physicalField");
  const meetingLink = document.getElementById("meetingLink");
  const location = document.getElementById("location");

  onlineField.classList.add("hidden");
  physicalField.classList.add("hidden");

  if (type === "Online") {
    onlineField.classList.remove("hidden");
    location.value = "";
  } else if (type === "Physical") {
    physicalField.classList.remove("hidden");
    meetingLink.value = "";
  }
}

function getEmployerInvitations() {
  return state.db.invitations.filter(
    (invitation) => invitation.employerId === state.session.id
  );
}

function renderInvitations() {
  const cardsContainer = document.getElementById("cardsContainer");
  const searchValue = document.getElementById("searchInput").value.trim().toLowerCase();
  const typeFilter = document.getElementById("typeFilter").value;
  const sortFilter = document.getElementById("sortFilter").value;

  let invitations = [...getEmployerInvitations()];

  if (searchValue) {
    invitations = invitations.filter((invitation) => {
      const combined = `${invitation.applicantName} ${invitation.jobTitle}`.toLowerCase();
      return combined.includes(searchValue);
    });
  }

  if (typeFilter !== "All") {
    invitations = invitations.filter(
      (invitation) => invitation.type === typeFilter
    );
  }

  if (sortFilter === "Newest") {
    invitations.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
  } else if (sortFilter === "Oldest") {
    invitations.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  } else if (sortFilter === "Applicant") {
    invitations.sort((a, b) => a.applicantName.localeCompare(b.applicantName));
  }

  updateStats();

  if (!invitations.length) {
    cardsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No invitations found</h3>
        <p>Try creating a new invitation or adjusting your search and filters.</p>
      </div>
    `;
    return;
  }

  cardsContainer.innerHTML = invitations
    .map((invitation) => {
      const detailText =
        invitation.type === "Online"
          ? `Link: ${invitation.meetingLink}`
          : `Location: ${invitation.location}`;

      return `
        <article class="card">
          <div class="card__title-row">
            <h3 class="card__title">${escapeHtml(invitation.jobTitle)}</h3>
            <span class="badge badge--pending">${escapeHtml(invitation.status)}</span>
          </div>

          <div class="card__meta">
            <span class="badge ${
              invitation.type === "Online" ? "badge--online" : "badge--physical"
            }">
              ${escapeHtml(invitation.type)}
            </span>
          </div>

          <div class="card__details">
            <div class="card__detail">
              <span>Applicant</span>
              <strong>${escapeHtml(invitation.applicantName)}</strong>
            </div>

            <div class="card__detail">
              <span>When</span>
              <strong>${formatDateTime(invitation.scheduledAt)}</strong>
            </div>

            <div class="card__detail">
              <span>Details</span>
              <p>${escapeHtml(detailText)}</p>
            </div>
          </div>

          <div class="card__actions">
            <button class="btn btn-view" type="button" onclick="openViewModal('${invitation.id}')">View</button>
            <button class="btn btn-edit" type="button" onclick="openEditModal('${invitation.id}')">Edit</button>
            <button class="btn btn-delete" type="button" onclick="deleteInvitation('${invitation.id}')">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateStats() {
  const invitations = getEmployerInvitations();
  document.getElementById("totalInvitations").textContent = invitations.length;
  document.getElementById("pendingInvitations").textContent = invitations.filter(
    (item) => item.status === "Pending"
  ).length;
  document.getElementById("onlineInvitations").textContent = invitations.filter(
    (item) => item.type === "Online"
  ).length;
  document.getElementById("physicalInvitations").textContent = invitations.filter(
    (item) => item.type === "Physical"
  ).length;
}

function openCreateModal() {
  document.getElementById("formModalTitle").textContent = "Create Interview Invitation";
  document.getElementById("saveInvitationBtn").textContent = "Save Invitation";
  document.getElementById("invitationForm").reset();
  document.getElementById("invitationId").value = "";
  document.getElementById("formMessage").textContent = "";
  document.getElementById("applicationId").disabled = false;
  document.getElementById("previewStatus").textContent = "Pending";

  populateApplicationOptions();
  toggleInterviewFields();
  updateApplicationPreview();

  document.getElementById("formModal").classList.add("is-open");
}

function openEditModal(invitationId) {
  const invitation = findInvitationById(invitationId);
  if (!invitation) return;

  document.getElementById("formModalTitle").textContent = "Edit Interview Invitation";
  document.getElementById("saveInvitationBtn").textContent = "Update Invitation";
  document.getElementById("formMessage").textContent = "";

  document.getElementById("invitationId").value = invitation.id;
  populateApplicationOptions(invitation.applicationId);
  document.getElementById("applicationId").disabled = true;

  document.getElementById("scheduledAt").value = toDatetimeLocalValue(invitation.scheduledAt);
  document.getElementById("interviewType").value = invitation.type;
  document.getElementById("meetingLink").value = invitation.meetingLink || "";
  document.getElementById("location").value = invitation.location || "";
  document.getElementById("notes").value = invitation.notes || "";

  document.getElementById("previewStatus").textContent = invitation.status;

  toggleInterviewFields();
  updateApplicationPreview();

  document.getElementById("formModal").classList.add("is-open");
}

function closeFormModal() {
  document.getElementById("formModal").classList.remove("is-open");
}

function openViewModal(invitationId) {
  const invitation = findInvitationById(invitationId);
  if (!invitation) return;

  document.getElementById("viewJobTitle").textContent = invitation.jobTitle;
  document.getElementById("viewApplicantSub").textContent = `Applicant: ${invitation.applicantName}`;
  document.getElementById("viewDateTime").textContent = formatDateTime(invitation.scheduledAt);
  document.getElementById("viewType").textContent = invitation.type;
  document.getElementById("viewDetails").textContent =
    invitation.type === "Online"
      ? invitation.meetingLink
      : invitation.location;
  document.getElementById("viewStatus").textContent = invitation.status;
  document.getElementById("viewNotes").textContent = invitation.notes || "No notes provided.";

  document.getElementById("viewModal").classList.add("is-open");
}

function closeViewModal() {
  document.getElementById("viewModal").classList.remove("is-open");
}

function handleInvitationSubmit(event) {
  event.preventDefault();

  const formMessage = document.getElementById("formMessage");
  formMessage.textContent = "";

  const invitationId = document.getElementById("invitationId").value.trim();
  const applicationId = document.getElementById("applicationId").value;
  const scheduledAt = document.getElementById("scheduledAt").value;
  const interviewType = document.getElementById("interviewType").value;
  const meetingLink = document.getElementById("meetingLink").value.trim();
  const location = document.getElementById("location").value.trim();
  const notes = document.getElementById("notes").value.trim();

  const application = findApplicationById(applicationId);

  const validation = validateInvitationForm({
    session: state.session,
    application,
    scheduledAt,
    interviewType,
    meetingLink,
    location
  });

  if (!validation.valid) {
    formMessage.textContent = validation.message;
    return;
  }

  const applicant = findUserById(application.jobSeekerId);

  if (!invitationId) {
    const newInvitation = {
      id: generateId("INV"),
      applicationId: application.id,
      jobSeekerId: application.jobSeekerId,
      applicantName: applicant ? applicant.name : "Unknown Applicant",
      employerId: state.session.id,
      employerName: state.session.name,
      jobTitle: application.jobTitle,
      type: interviewType,
      scheduledAt: new Date(scheduledAt).toISOString(),
      meetingLink: interviewType === "Online" ? meetingLink : "",
      location: interviewType === "Physical" ? location : "",
      notes,
      status: "Pending",
      createdBy: state.session.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.db.invitations.push(newInvitation);
    saveDatabase();
    closeFormModal();
    renderInvitations();
    showToast("Interview invitation created successfully.");
    return;
  }

  const existing = findInvitationById(invitationId);
  if (!existing) {
    formMessage.textContent = "Invitation not found.";
    return;
  }

  existing.type = interviewType;
  existing.scheduledAt = new Date(scheduledAt).toISOString();
  existing.meetingLink = interviewType === "Online" ? meetingLink : "";
  existing.location = interviewType === "Physical" ? location : "";
  existing.notes = notes;
  existing.updatedAt = new Date().toISOString();

  saveDatabase();
  closeFormModal();
  renderInvitations();
  showToast("Interview invitation updated successfully.");
}

function validateInvitationForm(data) {
  if (!data.session || data.session.role !== "employer") {
    return {
      valid: false,
      message: "Only a logged-in employer can create an interview invitation."
    };
  }

  if (!data.application) {
    return {
      valid: false,
      message: "Please select a valid job application."
    };
  }

  if (!data.scheduledAt || !data.interviewType) {
    return {
      valid: false,
      message: "Please fill in all mandatory fields."
    };
  }

  const selectedDate = new Date(data.scheduledAt);
  const now = new Date();

  if (Number.isNaN(selectedDate.getTime()) || selectedDate <= now) {
    return {
      valid: false,
      message: "Interview date and time must be in the future."
    };
  }

  if (data.interviewType === "Online") {
    if (!data.meetingLink) {
      return {
        valid: false,
        message: "A valid meeting link is required for an online interview."
      };
    }

    if (!isValidHttpUrl(data.meetingLink)) {
      return {
        valid: false,
        message: "Please enter a valid online meeting link starting with http or https."
      };
    }
  }

  if (data.interviewType === "Physical") {
    if (!data.location) {
      return {
        valid: false,
        message: "A location or address is required for a physical interview."
      };
    }
  }

  return { valid: true, message: "" };
}

function deleteInvitation(invitationId) {
  const invitation = findInvitationById(invitationId);
  if (!invitation) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete the invitation for ${invitation.applicantName}?`
  );

  if (!confirmed) return;

  state.db.invitations = state.db.invitations.filter(
    (item) => item.id !== invitationId
  );

  saveDatabase();
  renderInvitations();
  closeViewModal();
  showToast("Invitation deleted successfully.");
}
