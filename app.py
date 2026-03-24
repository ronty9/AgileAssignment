from flask import Flask, request, redirect, url_for, render_template_string, flash, session
import sqlite3
import os
from datetime import date, datetime
from uuid import uuid4

app = Flask(__name__)
app.secret_key = "dev-secret-key-change-me"
DB_PATH = "jobs.db"

ALLOWED_JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"]

ALLOWED_INDUSTRIES = [
    "Technology & IT",
    "Finance & Banking",
    "Healthcare & Medical",
    "Education & Academia",
    "Engineering & Manufacturing",
    "Marketing & Advertising",
    "Sales & Business Development",
    "Human Resources",
    "Legal & Compliance",
    "Retail & E-commerce",
    "Hospitality & Tourism",
    "Construction & Real Estate",
    "Logistics & Supply Chain",
    "Media & Entertainment",
    "Consulting & Professional Services",
    "Government & Public Sector",
    "Non-profit & NGO",
    "Agriculture & Environment",
    "Other",
]

# Input length limits
TITLE_MAX       = 100
LOCATION_MAX    = 100
DESCRIPTION_MIN = 20
DESCRIPTION_MAX = 5000
REQUIREMENTS_MAX = 3000
DEADLINE_MAX_YEARS = 2    # deadline must not be > 2 years from today

JOB_FORM_FIELDS = (
  "title",
  "description",
  "requirements",
  "location",
  "job_type",
  "industry",
  "application_deadline",
)


def _add_years(d, years):
    """Add `years` to date `d`, capping Feb-29 to Feb-28 in non-leap years."""
    try:
        return d.replace(year=d.year + years)
    except ValueError:          # e.g. Feb 29 → Feb 28 in target year
        return d.replace(year=d.year + years, day=28)


# --------------------------------------------------
# Shared CSS / navbar injected into every template
# --------------------------------------------------
SHARED_HEAD = """
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:              #f0f4f8;
    --card:            #ffffff;
    --text:            #111827;
    --text-sec:        #374151;
    --muted:           #6b7280;
    --border:          #e5e7eb;
    --primary:         #2563eb;
    --primary-dark:    #1d4ed8;
    --primary-light:   #eff6ff;
    --primary-border:  #bfdbfe;
    --success-bg:      #f0fdf4;
    --success-border:  #86efac;
    --success-text:    #15803d;
    --error:           #dc2626;
    --error-bg:        #fef2f2;
    --error-border:    #fca5a5;
    --error-text:      #b91c1c;
    --shadow-sm:       0 1px 3px rgba(15,23,42,.08);
    --shadow:          0 4px 16px rgba(15,23,42,.08);
    --radius:          12px;
    --radius-sm:       8px;
    --navbar-h:        62px;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 15px;
    line-height: 1.55;
  }

  /* Navbar */
  .navbar {
    height: var(--navbar-h);
    background: #fff;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 200;
    box-shadow: var(--shadow-sm);
    display: flex; align-items: center;
    padding: 0 28px; gap: 12px;
  }
  .navbar-brand {
    font-size: 17px; font-weight: 800;
    color: var(--primary); text-decoration: none;
    letter-spacing: -.3px; margin-right: auto;
    display: flex; align-items: center; gap: 8px;
  }
  .navbar-nav { display: flex; align-items: center; gap: 2px; }
  .nav-link {
    text-decoration: none; color: var(--muted);
    font-size: 14px; font-weight: 500;
    padding: 7px 12px; border-radius: var(--radius-sm);
    transition: background .15s, color .15s; white-space: nowrap;
  }
  .nav-link:hover { background: #f3f4f6; color: var(--text); }
  .nav-sep { width: 1px; height: 22px; background: var(--border); margin: 0 6px; }
  .nav-user {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-radius: var(--radius-sm);
    background: var(--primary-light);
    font-size: 13px; font-weight: 600; color: var(--primary-dark);
  }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--primary); color: white;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  /* Layout */
  .page { max-width: 1100px; margin: 32px auto; padding: 0 20px; }

  /* Cards */
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px;
  }
  .card + .card { margin-top: 16px; }
  .card-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 16px; }

  /* Flash */
  .flash {
    border-radius: var(--radius-sm); padding: 12px 16px;
    margin-bottom: 16px; border: 1px solid transparent;
    font-size: 14px; font-weight: 500;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .flash.success { background: var(--success-bg); border-color: var(--success-border); color: var(--success-text); }
  .flash.error { background: var(--error-bg); border-color: var(--error-border); color: var(--error-text); }

  /* Buttons */
  .btn, .btn-outline {
    display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none; border-radius: var(--radius-sm);
    padding: 9px 16px; font-weight: 600; font-size: 14px;
    transition: all .15s ease; cursor: pointer; white-space: nowrap;
    border: 1px solid transparent; font-family: inherit;
  }
  .btn { background: var(--primary); color: white; border-color: var(--primary); }
  .btn:hover { background: var(--primary-dark); border-color: var(--primary-dark); }
  .btn-outline { background: white; color: var(--text-sec); border-color: var(--border); }
  .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
  .btn-white {
    display: inline-flex; align-items: center; gap: 6px;
    background: white; color: var(--primary);
    padding: 9px 16px; border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 700; text-decoration: none;
    transition: background .15s;
  }
  .btn-white:hover { background: #f0f9ff; }
  .btn-white-outline {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.15); color: white;
    padding: 9px 16px; border-radius: var(--radius-sm);
    font-size: 14px; font-weight: 600; text-decoration: none;
    border: 1px solid rgba(255,255,255,.35); transition: background .15s;
  }
  .btn-white-outline:hover { background: rgba(255,255,255,.25); }

  /* Badges */
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 999px;
    font-size: 12px; font-weight: 600; border: 1px solid transparent;
  }
  .badge-blue   { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
  .badge-purple { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
  .badge-green  { background: #f0fdf4; color: #15803d; border-color: #86efac; }
  .badge-orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
  .badge-gray   { background: #f9fafb; color: #4b5563; border-color: #d1d5db; }

  /* Forms */
  .form-field { margin-bottom: 18px; }
  .form-label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 13px; color: var(--text-sec); }
  .required { color: var(--error); margin-left: 2px; }
  .form-control {
    width: 100%; border: 1.5px solid #d1d5db; background: #fff;
    border-radius: var(--radius-sm); padding: 9px 13px;
    font-size: 14px; font-family: inherit; color: var(--text);
    outline: none; transition: border-color .15s, box-shadow .15s;
  }
  .form-control:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
  .form-control::placeholder { color: #9ca3af; }
  textarea.form-control { min-height: 140px; resize: vertical; line-height: 1.5; }
  .form-field.has-error .form-control { border-color: #f87171; background: #fffafa; }
  .form-field.has-error .form-control:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.12); }
  .field-error { margin-top: 5px; color: var(--error); font-size: 13px; font-weight: 500; }
  .char-hint { margin-top: 4px; font-size: 12px; color: var(--muted); }
  .error-summary {
    border: 1px solid var(--error-border); background: var(--error-bg);
    border-radius: var(--radius-sm); padding: 12px 16px; margin-bottom: 20px;
  }
  .error-summary strong { color: #991b1b; display: block; margin-bottom: 6px; }
  .error-summary ul { padding-left: 18px; }
  .error-summary li { margin-bottom: 4px; font-size: 13px; color: #7f1d1d; }

  /* Table */
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius); background: white; }
  table { width: 100%; border-collapse: collapse; min-width: 860px; }
  th, td { padding: 13px 14px; border-bottom: 1px solid var(--border); text-align: left; font-size: 14px; vertical-align: middle; }
  th {
    background: #f8fafc; color: #374151; font-weight: 700; font-size: 12px;
    text-transform: uppercase; letter-spacing: .05em;
    position: sticky; top: 0; z-index: 1;
  }
  tbody tr:hover td { background: #f9fbff; }
  tbody tr:last-child td { border-bottom: none; }

  /* Misc */
  code { background: #f3f4f6; padding: 2px 7px; border-radius: 5px; font-size: 12px; font-family: 'SF Mono','Fira Mono',monospace; color: #374151; }
  .muted { color: var(--muted); }
  .small { font-size: 13px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }

  /* Hero */
  .hero {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%);
    color: white; border-radius: var(--radius); padding: 32px 28px;
    margin-bottom: 24px; position: relative; overflow: hidden;
  }
  .hero::after {
    content: ''; position: absolute; right: -40px; top: -40px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(255,255,255,.07);
  }
  .hero h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; letter-spacing: -.4px; }
  .hero p { font-size: 14px; opacity: .85; }
  .hero-actions { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; }

  /* Page header */
  .page-header {
    display: flex; flex-wrap: wrap;
    justify-content: space-between; align-items: flex-start;
    gap: 12px; margin-bottom: 24px;
  }
  .page-header h1 { font-size: 24px; font-weight: 800; letter-spacing: -.3px; }
  .page-header .sub { font-size: 14px; color: var(--muted); margin-top: 3px; }
  .page-header .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

  /* Scope list */
  .scope-list { list-style: none; padding: 0; }
  .scope-list li {
    padding: 7px 0; border-bottom: 1px solid var(--border);
    font-size: 14px; display: flex; align-items: flex-start; gap: 8px; color: var(--text-sec);
  }
  .scope-list li:last-child { border-bottom: none; }
  .scope-list li::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--primary); margin-top: 6px; flex-shrink: 0; }

  /* Sidebar note */
  .sidebar-note {
    background: var(--primary-light); border: 1px solid var(--primary-border);
    border-radius: var(--radius-sm); padding: 14px 16px;
    font-size: 13px; color: var(--primary-dark); margin-bottom: 14px;
  }
  .sidebar-note strong { display: block; margin-bottom: 6px; font-size: 13px; }

  /* Empty state */
  .empty-state { text-align: center; padding: 56px 20px; color: var(--muted); }
  .empty-state svg { margin: 0 auto 16px; display: block; opacity: .35; }
  .empty-state h3 { font-size: 16px; font-weight: 600; color: var(--text-sec); margin-bottom: 6px; }
  .empty-state p { font-size: 14px; }
</style>
"""

NAVBAR_TEMPLATE = """
<nav class="navbar">
  <a class="navbar-brand" href="{{ url_for('home') }}">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
    JobPortal
  </a>
  <nav class="navbar-nav">
    {% if session.get('role') == 'employer' %}
      <a class="nav-link" href="{{ url_for('new_job') }}">+ Post Job</a>
      <a class="nav-link" href="{{ url_for('employer_jobs') }}">My Jobs</a>
      <div class="nav-sep"></div>
      <div class="nav-user">
        <div class="avatar">{{ session.get('employer_name', 'E')[0] }}</div>
        {{ session.get('employer_name') }}
      </div>
      <a class="nav-link" href="{{ url_for('logout') }}">Logout</a>
    {% else %}
      <a class="nav-link btn" style="padding:7px 14px;" href="{{ url_for('login_employer') }}">Demo Login</a>
    {% endif %}
  </nav>
</nav>
"""


def job_type_badge(jt):
    mapping = {
        "Full-time":  "badge-blue",
        "Part-time":  "badge-purple",
        "Internship": "badge-green",
        "Contract":   "badge-orange",
    }
    cls = mapping.get(jt, "badge-gray")
    return f'<span class="badge {cls}">{jt}</span>'


# -----------------------------
# Database helpers
# -----------------------------
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            employer_id TEXT NOT NULL,
            employer_name TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            location TEXT NOT NULL,
            job_type TEXT NOT NULL,
            industry TEXT NOT NULL DEFAULT '',
            application_deadline TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open',
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    # Migrate existing databases: add industry column if not yet present
    try:
        conn.execute("ALTER TABLE jobs ADD COLUMN industry TEXT NOT NULL DEFAULT ''")
        conn.commit()
    except Exception:
        pass  # column already exists
    
    # Migrate existing databases: add requirements column if not yet present
    try:
        conn.execute("ALTER TABLE jobs ADD COLUMN requirements TEXT NOT NULL DEFAULT ''")
        conn.commit()
    except Exception:
        pass  # column already exists
    conn.close()


init_db()


# -----------------------------
# Auth / session helpers
# -----------------------------
def is_employer_logged_in():
    return session.get("role") == "employer" and session.get("employer_id")


def validate_job_form(form_data):
    """
    Returns dict of field errors, e.g.:
    {
      "title": "Job Title is required.",
      "application_deadline": "Application deadline cannot be earlier than today."
    }
    """
    errors = {}

    # Required field checks
    required_fields = {
        "title": "Job Title",
        "description": "Job Description",
        "requirements": "Job Requirements",
        "location": "Location",
        "job_type": "Job Type",
        "industry": "Industry",
        "application_deadline": "Application Deadline",
    }

    for field, label in required_fields.items():
        value = (form_data.get(field) or "").strip()
        if not value:
            errors[field] = f"{label} is required."

    # Title length
    title = (form_data.get("title") or "").strip()
    if title and len(title) > TITLE_MAX:
        errors["title"] = f"Job Title must not exceed {TITLE_MAX} characters (currently {len(title)})."

    # Description length (min + max)
    description = (form_data.get("description") or "").strip()
    if description and len(description) < DESCRIPTION_MIN:
        errors["description"] = f"Job Description must be at least {DESCRIPTION_MIN} characters."
    elif description and len(description) > DESCRIPTION_MAX:
        errors["description"] = f"Job Description must not exceed {DESCRIPTION_MAX} characters (currently {len(description)})."

    # Requirements length (min + max)
    requirements = (form_data.get("requirements") or "").strip()
    if requirements and len(requirements) < DESCRIPTION_MIN:
        errors["requirements"] = f"Job Requirements must be at least {DESCRIPTION_MIN} characters."
    elif requirements and len(requirements) > REQUIREMENTS_MAX:
        errors["requirements"] = f"Job Requirements must not exceed {REQUIREMENTS_MAX} characters (currently {len(requirements)})."

    # Location length
    location = (form_data.get("location") or "").strip()
    if location and len(location) > LOCATION_MAX:
        errors["location"] = f"Location must not exceed {LOCATION_MAX} characters (currently {len(location)})."

    # Job type validation
    job_type = (form_data.get("job_type") or "").strip()
    if job_type and job_type not in ALLOWED_JOB_TYPES:
        errors["job_type"] = "Invalid or unsupported job type selected."

    # Industry validation
    industry = (form_data.get("industry") or "").strip()
    if industry and industry not in ALLOWED_INDUSTRIES:
        errors["industry"] = "Invalid or unsupported industry selected."

    # Application deadline validation
    deadline_raw = (form_data.get("application_deadline") or "").strip()
    if deadline_raw:
        try:
            deadline_date = datetime.strptime(deadline_raw, "%Y-%m-%d").date()
            today = date.today()
            if deadline_date < today:
                errors["application_deadline"] = "Application deadline cannot be earlier than today."
            else:
                # SAT extra: reject unreasonably far-future dates
                max_deadline = _add_years(today, DEADLINE_MAX_YEARS)
                if deadline_date > max_deadline:
                    errors["application_deadline"] = (
                        f"Application deadline cannot be more than {DEADLINE_MAX_YEARS} years from today "
                        f"(latest allowed: {max_deadline.strftime('%Y-%m-%d')})."
                    )
        except ValueError:
            errors["application_deadline"] = "Application deadline format is invalid (YYYY-MM-DD required)."

    return errors


def empty_job_form_values():
    return {field: "" for field in JOB_FORM_FIELDS}


def parse_job_form(form_data):
    return {field: (form_data.get(field) or "").strip() for field in JOB_FORM_FIELDS}


def job_row_to_form_values(job_row):
    return {field: (job_row[field] or "") for field in JOB_FORM_FIELDS}


# -----------------------------
# Routes
# -----------------------------
@app.route("/")
def home():
    return render_template_string(
        """
<!doctype html>
<html lang="en">
<head>""" + SHARED_HEAD + """<title>JobPortal — Home</title>
</head>
<body>""" + NAVBAR_TEMPLATE + """
  <div class="page">

    {% with messages = get_flashed_messages(with_categories=true) %}
      {% if messages %}
        {% for category, message in messages %}
          <div class="flash {{ 'error' if category == 'error' else 'success' }}">
            {% if category == 'success' %}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><path d="M20 6L9 17l-5-5"/></svg>{% else %}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{% endif %}
            {{ message }}
          </div>
        {% endfor %}
      {% endif %}
    {% endwith %}

    {% if session.get('role') == 'employer' %}
      <div class="hero">
        <h1>Welcome back, {{ session.get('employer_name') }}</h1>
        <p>Manage your job postings and attract top talent for your company.</p>
        <div class="hero-actions">
          <a class="btn-white" href="{{ url_for('new_job') }}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post a Job Opening
          </a>
          <a class="btn-white-outline" href="{{ url_for('employer_jobs') }}">View My Posted Jobs</a>
        </div>
      </div>
    {% else %}
      <div class="hero">
        <h1>Employer Job Management</h1>
        <p>Post job openings and manage your recruitment pipeline — all in one place.</p>
        <div class="hero-actions">
          <a class="btn-white" href="{{ url_for('login_employer') }}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Demo Login as Employer
          </a>
        </div>
      </div>
    {% endif %}

    <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:16px;">
      <div>
        <div class="card">
          <div class="card-title">User Story — Sprint 1</div>
          <p style="font-size:14px;color:var(--text-sec);line-height:1.65;">
            <strong>As an employer</strong>, I want to post a job opening by entering the required job
            details so that I can attract suitable candidates for my company.
          </p>
          {% if session.get('role') == 'employer' %}
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;">
              <a class="btn" href="{{ url_for('new_job') }}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Post Job Opening
              </a>
              <a class="btn-outline" href="{{ url_for('employer_jobs') }}">My Posted Jobs</a>
            </div>
          {% endif %}
        </div>
        {% if session.get('role') == 'employer' %}
        <div class="card">
          <div class="card-title">Active Session</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="avatar" style="width:40px;height:40px;font-size:15px;flex-shrink:0;">{{ session.get('employer_name', 'E')[0] }}</div>
            <div>
              <div style="font-weight:600;">{{ session.get('employer_name') }}</div>
              <div class="muted small" style="margin-top:2px;">
                ID: <code>{{ session.get('employer_id') }}</code> &nbsp;·&nbsp;
                <span class="badge badge-blue">{{ session.get('role') }}</span>
              </div>
            </div>
          </div>
        </div>
        {% endif %}
      </div>
      <div>
        <div class="card">
          <div class="card-title">Sprint 1 Scope</div>
          <ul class="scope-list">
            <li>Employer-only access to Post Job feature</li>
            <li>Required fields validation</li>
            <li>Job type validation (server-side)</li>
            <li>Application deadline — format + not in past</li>
            <li>Auto-generate unique Job ID</li>
            <li>Default status: <strong>Open</strong></li>
            <li>Persist to SQLite</li>
            <li>Show posted jobs in employer list</li>
          </ul>
        </div>
        <div class="card">
          <div class="card-title">Allowed Job Types</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
            {% for jt in allowed_job_types %}{{ job_type_badge(jt) | safe }}{% endfor %}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
        """,
        allowed_job_types=ALLOWED_JOB_TYPES,
        job_type_badge=job_type_badge,
    )


@app.route("/login/employer")
def login_employer():
    # Demo login (for Sprint 1 prototype)
    session["role"] = "employer"
    session["employer_id"] = "EMP001"
    session["employer_name"] = "Acme HR"
    flash("Demo employer login successful.", "success")
    return redirect(url_for("home"))


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("home"))


@app.route("/jobs/new", methods=["GET", "POST"])
def new_job():
    # SAT #1: only authenticated employer can access
    if not is_employer_logged_in():
        flash("Only an authenticated employer can access the Post Job Opening function.", "error")
        return redirect(url_for("home"))

    form_values = empty_job_form_values()
    errors = {}

    if request.method == "POST":
        form_values = parse_job_form(request.form)

        # SAT #3, #4, #5, #6
        errors = validate_job_form(form_values)

        # SAT #13: no record created when validation fails (handled by only inserting if no errors)
        if not errors:
            job_id = "JOB-" + uuid4().hex[:8].upper()  # SAT #10 unique job record ID
            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = get_conn()
            conn.execute(
                """
                INSERT INTO jobs (
                    job_id, employer_id, employer_name, title, description, requirements, location,
                    job_type, industry, application_deadline, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job_id,
                    session["employer_id"],     # SAT #9 employer linkage
                    session["employer_name"],
                    form_values["title"],
                    form_values["description"],
                    form_values["requirements"],
                    form_values["location"],
                    form_values["job_type"],
                    form_values["industry"],
                    form_values["application_deadline"],
                    "Open",                     # SAT #8 default status
                    created_at,
                ),
            )
            conn.commit()
            conn.close()

            # SAT #12 success message + includes job ID/status for clearer evidence
            flash(f"Job posting created successfully. Job ID: {job_id} | Status: Open", "success")
            return redirect(url_for("employer_jobs"))

    today_str = date.today().strftime("%Y-%m-%d")
    max_deadline_str = (_add_years(date.today(), DEADLINE_MAX_YEARS)).strftime("%Y-%m-%d")

    return render_template_string(
        """
<!doctype html>
<html lang="en">
<head>""" + SHARED_HEAD + """<title>Post Job Opening — JobPortal</title>
</head>
<body>""" + NAVBAR_TEMPLATE + """
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Post a Job Opening</h1>
        <div class="sub">Logged in as <strong>{{ session.get('employer_name') }}</strong> · <code>{{ session.get('employer_id') }}</code></div>
      </div>
      <div class="actions">
        <a class="btn-outline" href="{{ url_for('home') }}">← Home</a>
        <a class="btn-outline" href="{{ url_for('employer_jobs') }}">My Posted Jobs</a>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 0.75fr;gap:16px;align-items:start;">
      <div class="card">
        {% if errors %}
          <div class="error-summary">
            <strong>Please fix the following errors before submitting:</strong>
            <ul>{% for msg in errors.values() %}<li>{{ msg }}</li>{% endfor %}</ul>
          </div>
        {% endif %}

        <form method="post" novalidate>
          <div class="form-field {{ 'has-error' if errors.get('title') }}">
            <label class="form-label" for="title">Job Title <span class="required">*</span></label>
            <input class="form-control" type="text" id="title" name="title"
              value="{{ form_values.title }}" placeholder="e.g., Junior Software Engineer"
              autocomplete="off" maxlength="{{ title_max }}">
            <div class="char-hint">Max {{ title_max }} characters</div>
            {% if errors.get('title') %}<div class="field-error">{{ errors.get('title') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('description') }}">
            <label class="form-label" for="description">Job Description <span class="required">*</span></label>
            <textarea class="form-control" id="description" name="description"
              placeholder="Enter responsibilities, duties, and what the role involves…"
              maxlength="{{ description_max }}">{{ form_values.description }}</textarea>
            <div class="char-hint">Min {{ description_min }} · Max {{ description_max }} characters</div>
            {% if errors.get('description') %}<div class="field-error">{{ errors.get('description') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('requirements') }}">
            <label class="form-label" for="requirements">Job Requirements <span class="required">*</span></label>
            <textarea class="form-control" id="requirements" name="requirements"
              placeholder="Enter skills, qualifications, experience, and other requirements…"
              maxlength="{{ requirements_max }}">{{ form_values.requirements }}</textarea>
            <div class="char-hint">Min {{ description_min }} · Max {{ requirements_max }} characters</div>
            {% if errors.get('requirements') %}<div class="field-error">{{ errors.get('requirements') }}</div>{% endif %}
          </div>

          <div class="grid-2">
            <div class="form-field {{ 'has-error' if errors.get('location') }}">
              <label class="form-label" for="location">Location <span class="required">*</span></label>
              <input class="form-control" type="text" id="location" name="location"
                value="{{ form_values.location }}" placeholder="e.g., Penang"
                maxlength="{{ location_max }}">
              {% if errors.get('location') %}<div class="field-error">{{ errors.get('location') }}</div>{% endif %}
            </div>
            <div class="form-field {{ 'has-error' if errors.get('job_type') }}">
              <label class="form-label" for="job_type">Job Type <span class="required">*</span></label>
              <select class="form-control" id="job_type" name="job_type">
                <option value="">— Select Job Type —</option>
                {% for jt in allowed_job_types %}
                  <option value="{{ jt }}" {% if form_values.job_type == jt %}selected{% endif %}>{{ jt }}</option>
                {% endfor %}
              </select>
              {% if errors.get('job_type') %}<div class="field-error">{{ errors.get('job_type') }}</div>{% endif %}
            </div>
          </div>

          <div class="form-field {{ 'has-error' if errors.get('industry') }}">
            <label class="form-label" for="industry">Industry <span class="required">*</span></label>
            <select class="form-control" id="industry" name="industry">
              <option value="">— Select Industry —</option>
              {% for ind in allowed_industries %}
                <option value="{{ ind }}" {% if form_values.industry == ind %}selected{% endif %}>{{ ind }}</option>
              {% endfor %}
            </select>
            {% if errors.get('industry') %}<div class="field-error">{{ errors.get('industry') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('application_deadline') }}">
            <label class="form-label" for="application_deadline">Application Deadline <span class="required">*</span></label>
            <input class="form-control" type="date" id="application_deadline" name="application_deadline"
              value="{{ form_values.application_deadline }}"
              min="{{ today_str }}" max="{{ max_deadline_str }}" style="max-width:220px;">
            <div class="char-hint">Between today and {{ max_deadline_str }}</div>
            {% if errors.get('application_deadline') %}<div class="field-error">{{ errors.get('application_deadline') }}</div>{% endif %}
          </div>

          <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
            <button type="submit" class="btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Publish Job
            </button>
            <a class="btn-outline" href="{{ url_for('employer_jobs') }}">Cancel</a>
          </div>
        </form>
      </div>

      <div>
        <div class="sidebar-note">
          <strong>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Validation Rules
          </strong>
          All fields marked <span class="required">*</span> are required.<br><br>
          Title: max {{ title_max }} chars.<br>
          Description: {{ description_min }}–{{ description_max }} chars.<br>
          Requirements: {{ description_min }}–{{ requirements_max }} chars.<br>
          Location: max {{ location_max }} chars.<br>
          Industry: select from the list.<br>
          Deadline: today → {{ max_deadline_str }}.<br><br>
          On success the job is saved with status <strong>Open</strong> and a unique Job ID.
        </div>
        <div class="card">
          <div class="card-title" style="font-size:14px;">Allowed Job Types</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            {% for jt in allowed_job_types %}{{ job_type_badge(jt) | safe }}{% endfor %}
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
        """,
        form_values=form_values,
        errors=errors,
        allowed_job_types=ALLOWED_JOB_TYPES,
        job_type_badge=job_type_badge,
        today_str=today_str,
        max_deadline_str=max_deadline_str,
        title_max=TITLE_MAX,
        location_max=LOCATION_MAX,
        description_min=DESCRIPTION_MIN,
        description_max=DESCRIPTION_MAX,
        requirements_max=REQUIREMENTS_MAX,
        allowed_industries=ALLOWED_INDUSTRIES,
    )


@app.route("/employer/jobs")
def employer_jobs():
    # SAT #1 and #11 (access + listing)
    if not is_employer_logged_in():
        flash("Only an authenticated employer can view employer job postings.", "error")
        return redirect(url_for("home"))

    conn = get_conn()
    jobs = conn.execute(
        """
        SELECT job_id, employer_id, employer_name, title, location, job_type,
               industry, application_deadline, status, created_at
        FROM jobs
        WHERE employer_id = ?
        ORDER BY created_at DESC
        """,
        (session["employer_id"],),
    ).fetchall()
    conn.close()

    return render_template_string(
        """
<!doctype html>
<html lang="en">
<head>""" + SHARED_HEAD + """<title>My Posted Jobs — JobPortal</title>
</head>
<body>""" + NAVBAR_TEMPLATE + """
  <div class="page">
    <div class="page-header">
      <div>
        <h1>My Posted Jobs</h1>
        <div class="sub">
          {{ session.get('employer_name') }} &nbsp;·&nbsp; <code>{{ session.get('employer_id') }}</code>
          &nbsp;·&nbsp; <span class="badge badge-blue">{{ jobs|length }} posting{{ 's' if jobs|length != 1 }}</span>
        </div>
      </div>
      <div class="actions">
        <a class="btn-outline" href="{{ url_for('home') }}">← Home</a>
        <a class="btn" href="{{ url_for('new_job') }}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Post New Job
        </a>
      </div>
    </div>

    {% with messages = get_flashed_messages(with_categories=true) %}
      {% if messages %}
        {% for category, message in messages %}
          <div class="flash {{ 'error' if category == 'error' else 'success' }}">
            {% if category == 'success' %}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><path d="M20 6L9 17l-5-5"/></svg>{% else %}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{% endif %}
            {{ message }}
          </div>
        {% endfor %}
      {% endif %}
    {% endwith %}

    {% if jobs %}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Title</th>
              <th>Location</th>
              <th>Job Type</th>
              <th>Industry</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Posted At</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            {% for job in jobs %}
              <tr>
                <td><code>{{ job['job_id'] }}</code></td>
                <td><strong><a href="{{ url_for('view_job', job_id=job['job_id']) }}" style="color:inherit; text-decoration:none;">{{ job['title'] }}</a></strong></td>
                <td>
                  <span style="display:flex;align-items:center;gap:5px;color:var(--text-sec);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {{ job['location'] }}
                  </span>
                </td>
                <td>{{ job_type_badge(job['job_type']) | safe }}</td>
                <td><span class="small muted">{{ job['industry'] }}</span></td>
                <td><span class="small muted">{{ job['application_deadline'] }}</span></td>
                <td>
                  <span class="badge badge-green">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" style="margin-right:3px"><circle cx="12" cy="12" r="8"/></svg>
                    {{ job['status'] }}
                  </span>
                </td>
                <td><span class="small muted">{{ job['created_at'] }}</span></td>
                <td style="text-align:right;">
                  <a class="btn-outline" style="padding:4px 10px; font-size:12px;" href="{{ url_for('view_job', job_id=job['job_id']) }}">View</a>
                  <a class="btn-outline" style="padding:4px 10px; font-size:12px; margin-left:6px;" href="{{ url_for('edit_job', job_id=job['job_id']) }}">Edit</a>
                </td>
              </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    {% else %}
      <div class="card">
        <div class="empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <h3>No job postings yet</h3>
          <p>Click <strong>Post New Job</strong> above to create your first job opening.</p>
        </div>
      </div>
    {% endif %}
  </div>
</body>
</html>
        """,
        jobs=jobs,
        job_type_badge=job_type_badge,
    )


@app.route("/jobs/<job_id>")
def view_job(job_id):
    if not is_employer_logged_in():
        flash("Only an authenticated employer can view job postings.", "error")
        return redirect(url_for("home"))

    conn = get_conn()
    job = conn.execute(
        """
        SELECT job_id, employer_id, employer_name, title, description, requirements, location, job_type,
               industry, application_deadline, status, created_at
        FROM jobs
        WHERE job_id = ? AND employer_id = ?
        """,
        (job_id, session["employer_id"]),
    ).fetchone()
    conn.close()

    if not job:
        flash("Job not found or you do not have permission to view it.", "error")
        return redirect(url_for("employer_jobs"))

    return render_template_string(
        """
<!doctype html>
<html lang="en">
<head>""" + SHARED_HEAD + """
<style>
  .job-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white; border-radius: var(--radius); padding: 48px 40px;
    margin-bottom: 32px; position: relative; overflow: hidden;
    box-shadow: var(--shadow);
  }
  .job-hero::after {
    content: ''; position: absolute; right: -50px; top: -100px;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, rgba(255,255,255,0) 70%);
  }
  .job-hero-content {
    position: relative; z-index: 10;
  }
  .job-title {
    font-size: 34px; font-weight: 800; letter-spacing: -.5px; margin-bottom: 16px; line-height: 1.2;
  }
  .job-meta-top {
    display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; font-size: 15px; opacity: 0.95; align-items: center;
  }
  .meta-item {
    display: flex; align-items: center; gap: 6px; font-weight: 500;
  }
  .job-layout {
    display: grid; grid-template-columns: 2.2fr 1fr; gap: 28px; align-items: start;
  }
  @media (max-width: 768px) { .job-layout { grid-template-columns: 1fr; } }
  .detail-section { margin-bottom: 28px; }
  .detail-section h3 {
    font-size: 19px; font-weight: 700; color: var(--text); margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 12px;
  }
  .description-content {
    font-size: 15.5px; color: var(--text-sec); line-height: 1.75; white-space: pre-wrap;
  }
  .info-card {
    background: white; border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow-sm);
  }
  .info-row {
    display: flex; justify-content: space-between; padding: 18px 20px;
    border-bottom: 1px solid var(--border); font-size: 14px; align-items: center;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: var(--muted); display: flex; align-items: center; gap: 8px; font-weight: 600;}
  .info-value { font-weight: 600; color: var(--text); text-align: right; }
  
  /* Overwrite job-type badge colors inside hero so they are visible on dark bg */
  .job-hero .badge { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.25); color: white; backdrop-filter: blur(4px); font-size: 13px; padding: 5px 12px;}
</style>
<title>{{ job['title'] }} — JobPortal</title>
</head>
<body>""" + NAVBAR_TEMPLATE + """
  <div class="page" style="max-width: 1000px;">
    <div style="margin-bottom: 20px;">
      <a class="btn-outline" href="{{ url_for('employer_jobs') }}" style="border:none; padding:8px 0; color:var(--muted); box-shadow:none; background:transparent;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Jobs
      </a>
    </div>

    <div class="job-hero">
      <div class="job-hero-content">
        <div class="job-meta-top">
          {{ job_type_badge(job['job_type']) | safe }}
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ job['location'] }}
          </span>
          <span class="meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            {{ job['industry'] }}
          </span>
        </div>
        
        <h1 class="job-title">{{ job['title'] }}</h1>
        
        <div style="display:flex; gap:14px; align-items:center;">
          <a href="{{ url_for('edit_job', job_id=job['job_id']) }}" class="btn" style="background:white; color:#0f172a; border-color:white; padding: 10px 24px; font-size:15px; font-weight:700;">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
             Edit Job
          </a>
          <span class="badge {% if job['status'] == 'Open' %}badge-green{% else %}badge-gray{% endif %}" style="padding: 7px 16px; font-size:13px; margin-left: auto; {% if job['status'] == 'Open' %}background:rgba(34,197,94,0.2); color:#4ade80; border-color:rgba(74,222,128,0.4);{% endif %}">
             <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:currentColor; margin-right:6px; box-shadow: 0 0 8px currentColor;"></span>
             {{ job['status'] }}
          </span>
        </div>
      </div>
    </div>

    <div class="job-layout">
      <!-- Left Column -->
      <div>
        <div class="card" style="padding: 36px 32px;">
          <div class="detail-section" style="margin-bottom:0;">
            <h3>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              About the Role
            </h3>
            <div class="description-content">{{ job['description'] }}</div>
          </div>
        </div>

        <div class="card" style="padding: 36px 32px;">
          <div class="detail-section" style="margin-bottom:0;">
            <h3>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="muted"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Job Requirements
            </h3>
            <div class="description-content">{{ job['requirements'] }}</div>
          </div>
        </div>

        <div class="card" style="padding: 36px 32px;">
          <div class="detail-section" style="margin-bottom:0;">
            <h3>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="muted"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M17 21v-8.5a5.5 5.5 0 0 0-11 0V21"/></svg>
              About Our Company
            </h3>
            <div class="description-content" style="line-height:1.7;">
<strong>{{ job['employer_name'] }}</strong> is a <strong>Technology & IT</strong> company focused on innovation and excellence in software development. We are a <strong>mid-sized organization</strong> with a passion for building cutting-edge solutions that make a difference in people's lives.

<h4 style="font-size:16px; font-weight:700; color:var(--text); margin: 20px 0 12px;">Our Mission</h4>
<p style="margin:0;">To create innovative technology solutions that empower businesses and individuals to achieve more.</p>

<h4 style="font-size:16px; font-weight:700; color:var(--text); margin: 20px 0 12px;">Company Culture</h4>
<p style="margin:0;">We believe in fostering a collaborative, inclusive, and growth-oriented environment where every team member can thrive. Our culture values creativity, integrity, and continuous learning.</p>

<h4 style="font-size:16px; font-weight:700; color:var(--text); margin: 20px 0 12px;">Benefits & Perks</h4>
<ul style="margin:0; padding-left:20px; display:grid; gap:8px;">
  <li>Competitive salary and performance bonuses</li>
  <li>Health insurance and wellness programs</li>
  <li>Flexible work arrangements</li>
  <li>Professional development opportunities</li>
  <li>Modern office with collaborative spaces</li>
  <li>Team building activities and social events</li>
</ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Meta info -->
      <div>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Posted On
            </span>
            <span class="info-value">{{ job['created_at'].split(' ')[0] if ' ' in job['created_at'] else job['created_at'] }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#ef4444;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Deadline
            </span>
            <span class="info-value" style="color:#dc2626;">{{ job['application_deadline'] }}</span>
          </div>
          <div class="info-row" style="background:var(--bg);">
            <span class="info-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Job ID
            </span>
            <span class="info-value" style="font-family:monospace; font-size:13px; color:var(--text-sec); letter-spacing:0.5px;">{{ job['job_id'] }}</span>
          </div>
        </div>
        
        <div style="margin-top:24px; text-align:center;">
            <p style="font-size:13.5px; color:var(--muted); margin-bottom:14px; font-weight:500;">Share this posting to attract talent</p>
            <button class="btn" style="width:100%; justify-content:center; padding:12px; font-size:15px; background:white; color:var(--primary); border:1px solid var(--primary-border); box-shadow:var(--shadow-sm);" onclick="navigator.clipboard.writeText(window.location.href); alert('Link copied to clipboard!')" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='white'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Copy Link to Job
            </button>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
        """,        job=job,
        job_type_badge=job_type_badge,
    )


@app.route("/jobs/<job_id>/edit", methods=["GET", "POST"])
def edit_job(job_id):
    if not is_employer_logged_in():
        flash("Only an authenticated employer can edit job postings.", "error")
        return redirect(url_for("home"))

    conn = get_conn()
    existing_job = conn.execute(
        """
        SELECT job_id, employer_id, title, description, requirements, location,
               job_type, industry, application_deadline, status
        FROM jobs
        WHERE job_id = ? AND employer_id = ?
        """,
        (job_id, session["employer_id"]),
    ).fetchone()

    if not existing_job:
        conn.close()
        flash("Job not found or you do not have permission to edit it.", "error")
        return redirect(url_for("employer_jobs"))

    original_values = job_row_to_form_values(existing_job)
    form_values = original_values.copy()
    errors = {}

    if request.method == "POST":
      form_values = parse_job_form(request.form)

      if form_values == original_values:
        conn.close()
        flash(f"No changes detected for job posting {job_id}.", "success")
        return redirect(url_for("view_job", job_id=job_id))

      errors = validate_job_form(form_values)

      if not errors:
        conn.execute(
          """
          UPDATE jobs
          SET title = ?,
            description = ?,
            requirements = ?,
            location = ?,
            job_type = ?,
            industry = ?,
            application_deadline = ?
          WHERE job_id = ? AND employer_id = ?
          """,
          (
            form_values["title"],
            form_values["description"],
            form_values["requirements"],
            form_values["location"],
            form_values["job_type"],
            form_values["industry"],
            form_values["application_deadline"],
            job_id,
            session["employer_id"],
          ),
        )
        conn.commit()
        conn.close()
        flash(f"Job posting {job_id} updated successfully.", "success")
        return redirect(url_for("view_job", job_id=job_id))

    conn.close()

    today_str = date.today().strftime("%Y-%m-%d")
    max_deadline_str = (_add_years(date.today(), DEADLINE_MAX_YEARS)).strftime("%Y-%m-%d")

    return render_template_string(
        """
<!doctype html>
<html lang="en">
<head>""" + SHARED_HEAD + """<title>Edit Job Posting — JobPortal</title>
<style>
  .edit-hero {
    margin-bottom: 16px;
    border: 1px solid var(--primary-border);
    background: linear-gradient(130deg, #eff6ff 0%, #f8fbff 60%, #ffffff 100%);
    border-radius: var(--radius);
    padding: 16px 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .edit-hero-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }
  .edit-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
    gap: 16px;
    align-items: start;
  }
  .edit-card {
    border-top: 4px solid var(--primary);
  }
  .sticky-side {
    position: sticky;
    top: calc(var(--navbar-h) + 14px);
  }
  .mini-list {
    margin-top: 12px;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: #fff;
    overflow: hidden;
  }
  .mini-list li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
  }
  .mini-list li:last-child {
    border-bottom: 0;
  }
  .mini-list strong {
    color: var(--text-sec);
    font-weight: 600;
  }
  @media (max-width: 980px) {
    .edit-layout {
      grid-template-columns: 1fr;
    }
    .sticky-side {
      position: static;
    }
  }
</style>
</head>
<body>""" + NAVBAR_TEMPLATE + """
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Edit Job Posting</h1>
        <div class="sub">Updating <code>{{ job_id }}</code> for <strong>{{ session.get('employer_name') }}</strong></div>
      </div>
      <div class="actions">
        <a class="btn-outline" href="{{ url_for('view_job', job_id=job_id) }}">← Back to Job</a>
        <a class="btn-outline" href="{{ url_for('employer_jobs') }}">My Posted Jobs</a>
      </div>
    </div>

    <div class="edit-hero">
      <span class="edit-hero-chip">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        Editing Mode
      </span>
      <span class="small muted">Make updates and save to publish them immediately to this job posting.</span>
    </div>

    <div class="edit-layout">
      <div class="card edit-card">
        {% if errors %}
          <div class="error-summary">
            <strong>Please fix the following errors before submitting:</strong>
            <ul>{% for msg in errors.values() %}<li>{{ msg }}</li>{% endfor %}</ul>
          </div>
        {% endif %}

        <form method="post" novalidate>
          <div class="form-field {{ 'has-error' if errors.get('title') }}">
            <label class="form-label" for="title">Job Title <span class="required">*</span></label>
            <input class="form-control" type="text" id="title" name="title"
              data-counter="title_count"
              value="{{ form_values.title }}" placeholder="e.g., Junior Software Engineer"
              autocomplete="off" maxlength="{{ title_max }}">
            <div class="char-hint"><span id="title_count"></span> / {{ title_max }} characters</div>
            {% if errors.get('title') %}<div class="field-error">{{ errors.get('title') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('description') }}">
            <label class="form-label" for="description">Job Description <span class="required">*</span></label>
            <textarea class="form-control" id="description" name="description"
              data-counter="description_count"
              placeholder="Enter responsibilities, duties, and what the role involves…"
              maxlength="{{ description_max }}">{{ form_values.description }}</textarea>
            <div class="char-hint">Min {{ description_min }} · <span id="description_count"></span> / {{ description_max }} characters</div>
            {% if errors.get('description') %}<div class="field-error">{{ errors.get('description') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('requirements') }}">
            <label class="form-label" for="requirements">Job Requirements <span class="required">*</span></label>
            <textarea class="form-control" id="requirements" name="requirements"
              data-counter="requirements_count"
              placeholder="Enter skills, qualifications, experience, and other requirements…"
              maxlength="{{ requirements_max }}">{{ form_values.requirements }}</textarea>
            <div class="char-hint">Min {{ description_min }} · <span id="requirements_count"></span> / {{ requirements_max }} characters</div>
            {% if errors.get('requirements') %}<div class="field-error">{{ errors.get('requirements') }}</div>{% endif %}
          </div>

          <div class="grid-2">
            <div class="form-field {{ 'has-error' if errors.get('location') }}">
              <label class="form-label" for="location">Location <span class="required">*</span></label>
              <input class="form-control" type="text" id="location" name="location"
                value="{{ form_values.location }}" placeholder="e.g., Penang"
                maxlength="{{ location_max }}">
              {% if errors.get('location') %}<div class="field-error">{{ errors.get('location') }}</div>{% endif %}
            </div>
            <div class="form-field {{ 'has-error' if errors.get('job_type') }}">
              <label class="form-label" for="job_type">Job Type <span class="required">*</span></label>
              <select class="form-control" id="job_type" name="job_type">
                <option value="">— Select Job Type —</option>
                {% for jt in allowed_job_types %}
                  <option value="{{ jt }}" {% if form_values.job_type == jt %}selected{% endif %}>{{ jt }}</option>
                {% endfor %}
              </select>
              {% if errors.get('job_type') %}<div class="field-error">{{ errors.get('job_type') }}</div>{% endif %}
            </div>
          </div>

          <div class="form-field {{ 'has-error' if errors.get('industry') }}">
            <label class="form-label" for="industry">Industry <span class="required">*</span></label>
            <select class="form-control" id="industry" name="industry">
              <option value="">— Select Industry —</option>
              {% for ind in allowed_industries %}
                <option value="{{ ind }}" {% if form_values.industry == ind %}selected{% endif %}>{{ ind }}</option>
              {% endfor %}
            </select>
            {% if errors.get('industry') %}<div class="field-error">{{ errors.get('industry') }}</div>{% endif %}
          </div>

          <div class="form-field {{ 'has-error' if errors.get('application_deadline') }}">
            <label class="form-label" for="application_deadline">Application Deadline <span class="required">*</span></label>
            <input class="form-control" type="date" id="application_deadline" name="application_deadline"
              value="{{ form_values.application_deadline }}"
              min="{{ today_str }}" max="{{ max_deadline_str }}" style="max-width:220px;">
            <div class="char-hint">Between today and {{ max_deadline_str }}</div>
            {% if errors.get('application_deadline') %}<div class="field-error">{{ errors.get('application_deadline') }}</div>{% endif %}
          </div>

          <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
            <button type="submit" class="btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Changes
            </button>
            <a class="btn-outline" href="{{ url_for('view_job', job_id=job_id) }}">Cancel</a>
          </div>
        </form>
      </div>

      <div class="sticky-side">
        <div class="sidebar-note">
          <strong>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Edit Rules
          </strong>
          You can update title, description, requirements, location, job type, industry, and deadline.<br><br>
          Deadline must be between today and {{ max_deadline_str }}.<br>
          Existing job ID and status remain unchanged.
        </div>
        <ul class="mini-list">
          <li><strong>Job ID</strong><span>{{ job_id }}</span></li>
          <li><strong>Employer</strong><span>{{ session.get('employer_name') }}</span></li>
          <li><strong>Status</strong><span>Open/Closed unchanged</span></li>
        </ul>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var fields = document.querySelectorAll('[data-counter]');
      fields.forEach(function (field) {
        var counterId = field.getAttribute('data-counter');
        var target = document.getElementById(counterId);
        if (!target) return;

        var update = function () {
          target.textContent = String(field.value.length);
        };

        update();
        field.addEventListener('input', update);
      });
    })();
  </script>
</body>
</html>
        """,
        job_id=job_id,
        form_values=form_values,
        errors=errors,
        allowed_job_types=ALLOWED_JOB_TYPES,
        today_str=today_str,
        max_deadline_str=max_deadline_str,
        title_max=TITLE_MAX,
        location_max=LOCATION_MAX,
        description_min=DESCRIPTION_MIN,
        description_max=DESCRIPTION_MAX,
        requirements_max=REQUIREMENTS_MAX,
        allowed_industries=ALLOWED_INDUSTRIES,
    )


if __name__ == "__main__":
  port = int(os.environ.get("PORT", "5001"))
  app.run(debug=True, port=port)