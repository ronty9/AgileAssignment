// =====================================================================
// PART 1: BUSINESS LOGIC FOR USER STORY 3
// (Extracted from applications.js to make it testable)
// =====================================================================

// AC1: Check if the user is authenticated
function isAuthenticated(seekerId) {
  return seekerId !== null && seekerId.trim() !== "";
}

// AC2: Filter applications so they only belong to the logged-in job seeker
function getUserApplications(allApplications, loggedInSeekerId) {
  return allApplications.filter(app => app.seekerId === loggedInSeekerId);
}

// AC4: Sort the applications by date applied in descending order (newest first)
function sortApplicationsDescending(applications) {
  return applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

// AC3 & AC6: Prepare the dashboard state based on the user's data
function getDashboardState(seekerId, allApplications) {
  if (!isAuthenticated(seekerId)) {
    return { status: "error", message: "Please sign in to view your applications." };
  }

  const userApps = getUserApplications(allApplications, seekerId);
  const sortedApps = sortApplicationsDescending(userApps);

  // AC6: Clear message when the list is empty
  if (sortedApps.length === 0) {
    return { status: "empty", message: "You have not applied for any jobs yet", data: [] };
  }

  // AC3: Format data to ensure correct job information is displayed
  const formattedApps = sortedApps.map(app => ({
    id: app.id,
    jobTitle: app.jobTitle,
    company: app.company,
    appliedAt: app.appliedAt,
    status: app.status
  }));

  return { status: "success", data: formattedApps };
}

// AC5: Get the specific details of a single application
function getApplicationDetails(allApplications, appId) {
  return allApplications.find(app => app.id === appId) || null;
}

// =====================================================================
// PART 2: JEST UNIT TESTS
// =====================================================================

describe("User Story 3: View List of Applied Jobs", () => {
  
  // Mock Data setup for testing
  const mockApplications = [
    { id: "APP-001", seekerId: "Seeker-001", jobTitle: "Junior Web Developer", company: "TechNova", appliedAt: "2026-03-10", status: "SUBMITTED" },
    { id: "APP-002", seekerId: "Seeker-002", jobTitle: "UI/UX Designer", company: "PixelWorks", appliedAt: "2026-03-12", status: "INTERVIEW" },
    { id: "APP-003", seekerId: "Seeker-001", jobTitle: "Frontend Intern", company: "BlueOrbit", appliedAt: "2026-03-15", status: "UNDER REVIEW" }
  ];

  test("AC 1: Verify that only an authenticated job seeker can access the page", () => {
    expect(isAuthenticated("Seeker-001")).toBe(true);
    expect(isAuthenticated("")).toBe(false);
    expect(isAuthenticated(null)).toBe(false);
    
    const state = getDashboardState("", mockApplications);
    expect(state.status).toBe("error");
  });

  test("AC 2: Verify that the system displays only the applications that belong to the logged-in job seeker", () => {
    const seeker1Apps = getUserApplications(mockApplications, "Seeker-001");
    expect(seeker1Apps.length).toBe(2);
    // Ensure Seeker-002's app didn't leak into Seeker-001's list
    expect(seeker1Apps.some(app => app.id === "APP-002")).toBe(false);
  });

  test("AC 3: Verify that each application entry displays the Job Title, Company Name, Date Applied, and Application Status", () => {
    const state = getDashboardState("Seeker-001", mockApplications);
    const firstApp = state.data[0];
    
    expect(firstApp).toHaveProperty("jobTitle");
    expect(firstApp).toHaveProperty("company");
    expect(firstApp).toHaveProperty("appliedAt");
    expect(firstApp).toHaveProperty("status");
  });

  test("AC 4: Verify that the list of applications is sorted by the date applied in descending order", () => {
    const state = getDashboardState("Seeker-001", mockApplications);
    // APP-003 (March 15) should be before APP-001 (March 10)
    expect(state.data[0].id).toBe("APP-003");
    expect(state.data[1].id).toBe("APP-001");
  });

  test("AC 5: Verify that selecting an application opens the correct application details", () => {
    const details = getApplicationDetails(mockApplications, "APP-002");
    expect(details).not.toBeNull();
    expect(details.jobTitle).toBe("UI/UX Designer");
    expect(details.seekerId).toBe("Seeker-002");
  });

  test("AC 6: Verify that the system displays a clear message when the job seeker has an empty list", () => {
    // Seeker-003 has no applications in our mock data
    const state = getDashboardState("Seeker-003", mockApplications);
    
    expect(state.status).toBe("empty");
    expect(state.message).toBe("You have not applied for any jobs yet");
    expect(state.data.length).toBe(0);
  });

});