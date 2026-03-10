const INV_KEY = "jp_interview_invitations";

const JOBSEEKER_ACCOUNTS = [
  {
    id: "JS001",
    name: "Jimmy Kee",
    email: "jimmy@gmail.com",
    password: "jimmy123"
  },
  {
    id: "JS002",
    name: "Siti Nur",
    email: "siti.nur@gmail.com",
    password: "siti123"
  },
  {
    id: "JS003",
    name: "John Lee",
    email: "john.lee@gmail.com",
    password: "john123"
  },
  {
    id: "JS004",
    name: "Alicia Wong",
    email: "alicia.wong@gmail.com",
    password: "alicia123"
  },
  {
    id: "JS005",
    name: "Daniel Lim",
    email: "daniel.lim@gmail.com",
    password: "daniel123"
  }
];

const DEMO_INTERVIEWS = [
  {
    invitationId: "INV001",
    applicantId: "JS001",
    applicantName: "Jimmy Kee",
    employerName: "TechNova Sdn. Bhd.",
    jobTitle: "Frontend Developer Intern",
    interviewType: "ONLINE",
    interviewDate: "2026-03-15",
    interviewTime: "10:30",
    location: "",
    meetingLink: "https://meet.google.com/tn-frontend-001",
    notes: "Please join 10 minutes earlier and prepare your portfolio.",
    status: "PENDING",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-10T09:00:00.000Z"
  },
  {
    invitationId: "INV002",
    applicantId: "JS001",
    applicantName: "Jimmy Kee",
    employerName: "BluePeak Solutions",
    jobTitle: "UI/UX Designer Trainee",
    interviewType: "PHYSICAL",
    interviewDate: "2026-03-18",
    interviewTime: "14:00",
    location: "Level 8, BluePeak Tower, Kuala Lumpur",
    meetingLink: "",
    notes: "Bring your IC and printed resume.",
    status: "PENDING",
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-03-10T10:00:00.000Z"
  },
  {
    invitationId: "INV003",
    applicantId: "JS002",
    applicantName: "Siti Nur",
    employerName: "CloudMatrix",
    jobTitle: "Backend Developer Intern",
    interviewType: "ONLINE",
    interviewDate: "2026-03-20",
    interviewTime: "11:00",
    location: "",
    meetingLink: "https://meet.google.com/cm-backend-002",
    notes: "Interview will be conducted by the engineering team.",
    status: "PENDING",
    createdAt: "2026-03-10T11:00:00.000Z",
    updatedAt: "2026-03-10T11:00:00.000Z"
  },
  {
    invitationId: "INV004",
    applicantId: "JS003",
    applicantName: "John Lee",
    employerName: "NextWave Digital",
    jobTitle: "Mobile App Developer Intern",
    interviewType: "ONLINE",
    interviewDate: "2026-03-22",
    interviewTime: "09:00",
    location: "",
    meetingLink: "https://meet.google.com/nw-mobile-003",
    notes: "Please prepare to discuss your Flutter projects.",
    status: "PENDING",
    createdAt: "2026-03-11T08:00:00.000Z",
    updatedAt: "2026-03-11T08:00:00.000Z"
  },
  {
    invitationId: "INV005",
    applicantId: "JS004",
    applicantName: "Alicia Wong",
    employerName: "Inspire Creative Studio",
    jobTitle: "Graphic Design Intern",
    interviewType: "PHYSICAL",
    interviewDate: "2026-03-24",
    interviewTime: "15:30",
    location: "Lot 12, Inspire Hub, Petaling Jaya",
    meetingLink: "",
    notes: "Bring your design portfolio and resume.",
    status: "PENDING",
    createdAt: "2026-03-11T09:00:00.000Z",
    updatedAt: "2026-03-11T09:00:00.000Z"
  },
  {
    invitationId: "INV006",
    applicantId: "JS005",
    applicantName: "Daniel Lim",
    employerName: "FinEdge Solutions",
    jobTitle: "Data Analyst Intern",
    interviewType: "ONLINE",
    interviewDate: "2026-03-26",
    interviewTime: "13:00",
    location: "",
    meetingLink: "https://meet.google.com/fe-data-004",
    notes: "Please be prepared for a short Excel and SQL discussion.",
    status: "PENDING",
    createdAt: "2026-03-11T10:00:00.000Z",
    updatedAt: "2026-03-11T10:00:00.000Z"
  },
  {
    invitationId: "INV007",
    applicantId: "JS001",
    applicantName: "Alex Tan",
    employerName: "Vertex Systems",
    jobTitle: "Web Developer Intern",
    interviewType: "ONLINE",
    interviewDate: "2026-03-28",
    interviewTime: "16:00",
    location: "",
    meetingLink: "https://meet.google.com/vs-web-005",
    notes: "Be ready to explain your final year project briefly.",
    status: "PENDING",
    createdAt: "2026-03-12T08:30:00.000Z",
    updatedAt: "2026-03-12T08:30:00.000Z"
  },
  {
    invitationId: "INV008",
    applicantId: "JS002",
    applicantName: "Siti Nur",
    employerName: "PixelForge Agency",
    jobTitle: "Frontend Designer Intern",
    interviewType: "PHYSICAL",
    interviewDate: "2026-03-29",
    interviewTime: "10:00",
    location: "Level 5, PixelForge Plaza, Shah Alam",
    meetingLink: "",
    notes: "Please arrive 15 minutes earlier for registration.",
    status: "PENDING",
    createdAt: "2026-03-12T09:15:00.000Z",
    updatedAt: "2026-03-12T09:15:00.000Z"
  }
];

function initializeInterviewData() {
  const existing = localStorage.getItem(INV_KEY);
  if (!existing) {
    localStorage.setItem(INV_KEY, JSON.stringify(DEMO_INTERVIEWS));
  }
}

function getJobSeekerAccounts() {
  return JOBSEEKER_ACCOUNTS;
}

function getInterviewData() {
  initializeInterviewData();
  const raw = localStorage.getItem(INV_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveInterviewData(items) {
  localStorage.setItem(INV_KEY, JSON.stringify(items));
}