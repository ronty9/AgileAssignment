const {
  validateInvitationForm,
  isValidHttpUrl,
  canRescheduleInvitation,
  applyInvitationUpdate
} = require("../js/app.js");

describe("Reschedule Interview Story - Automated Unit Tests", () => {
  const ownerEmployerSession = {
    id: "EMP-001",
    role: "employer",
    name: "Aina Rahman"
  };

  const otherEmployerSession = {
    id: "EMP-002",
    role: "employer",
    name: "Marcus Lee"
  };

  const jobSeekerSession = {
    id: "JS-001",
    role: "job_seeker",
    name: "Siti Nur"
  };

  const application = {
    id: "APP-001",
    jobTitle: "Frontend Designer Intern",
    jobSeekerId: "JS-001",
    employerId: "EMP-001"
  };

  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const laterFutureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  function makeInvitation() {
    return {
      id: "INV-001",
      applicationId: "APP-001",
      jobSeekerId: "JS-001",
      applicantName: "Siti Nur",
      employerId: "EMP-001",
      employerName: "Aina Rahman",
      jobTitle: "Frontend Designer Intern",
      type: "Online",
      scheduledAt: futureDate,
      meetingLink: "https://meet.google.com/original-room",
      location: "",
      notes: "Original interview note",
      status: "Pending",
      updatedAt: "2026-03-24T00:00:00.000Z"
    };
  }

  test("1. only the employer who created the invitation can reschedule it", () => {
    const invitation = makeInvitation();

    expect(
      canRescheduleInvitation(ownerEmployerSession, invitation)
    ).toBe(true);

    expect(
      canRescheduleInvitation(otherEmployerSession, invitation)
    ).toBe(false);
  });

  test("2. non-employer users cannot reschedule the invitation", () => {
    const invitation = makeInvitation();

    expect(
      canRescheduleInvitation(jobSeekerSession, invitation)
    ).toBe(false);
  });

  test("3. mandatory updated details are required", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: "",
      interviewType: "",
      meetingLink: "",
      location: ""
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe("Please fill in all mandatory fields.");
  });

  test("4. system prevents rescheduling to a past date and time", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: pastDate,
      interviewType: "Online",
      meetingLink: "https://meet.google.com/new-room",
      location: ""
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe("Interview date and time must be in the future.");
  });

  test("5. online interview requires a meeting link", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: laterFutureDate,
      interviewType: "Online",
      meetingLink: "",
      location: ""
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe(
      "A valid meeting link is required for an online interview."
    );
  });

  test("6. online interview rejects invalid meeting link format", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: laterFutureDate,
      interviewType: "Online",
      meetingLink: "invalid-link",
      location: ""
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe(
      "Please enter a valid online meeting link starting with http or https."
    );
  });

  test("7. physical interview requires a location or address", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: laterFutureDate,
      interviewType: "Physical",
      meetingLink: "",
      location: ""
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe(
      "A location or address is required for a physical interview."
    );
  });

  test("8. valid online reschedule passes validation", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: laterFutureDate,
      interviewType: "Online",
      meetingLink: "https://meet.google.com/reschedule-room",
      location: ""
    });

    expect(result.valid).toBe(true);
    expect(result.message).toBe("");
  });

  test("9. valid physical reschedule passes validation", () => {
    const result = validateInvitationForm({
      session: ownerEmployerSession,
      application,
      scheduledAt: laterFutureDate,
      interviewType: "Physical",
      meetingLink: "",
      location: "Level 5, PixelForge Plaza, Shah Alam"
    });

    expect(result.valid).toBe(true);
    expect(result.message).toBe("");
  });

  test("10. applyInvitationUpdate updates online interview details correctly", () => {
    const invitation = makeInvitation();

    const updated = applyInvitationUpdate(invitation, {
      interviewType: "Online",
      scheduledAt: laterFutureDate,
      meetingLink: "https://meet.google.com/updated-room",
      location: "",
      notes: "Please join 10 minutes earlier."
    });

    expect(updated.type).toBe("Online");
    expect(updated.scheduledAt).toBe(new Date(laterFutureDate).toISOString());
    expect(updated.meetingLink).toBe("https://meet.google.com/updated-room");
    expect(updated.location).toBe("");
    expect(updated.notes).toBe("Please join 10 minutes earlier.");
  });

  test("11. applyInvitationUpdate updates physical interview details and clears meeting link", () => {
    const invitation = makeInvitation();

    const updated = applyInvitationUpdate(invitation, {
      interviewType: "Physical",
      scheduledAt: laterFutureDate,
      meetingLink: "https://meet.google.com/should-be-cleared",
      location: "NovaEdge Tower, Petaling Jaya",
      notes: "Bring identification document."
    });

    expect(updated.type).toBe("Physical");
    expect(updated.scheduledAt).toBe(new Date(laterFutureDate).toISOString());
    expect(updated.meetingLink).toBe("");
    expect(updated.location).toBe("NovaEdge Tower, Petaling Jaya");
    expect(updated.notes).toBe("Bring identification document.");
  });

  test("12. helper validates URL format correctly", () => {
    expect(isValidHttpUrl("https://meet.google.com/test-room")).toBe(true);
    expect(isValidHttpUrl("http://example.com")).toBe(true);
    expect(isValidHttpUrl("abc123")).toBe(false);
  });
});