from flask import Flask, request, redirect, url_for, render_template_string, flash, session
import sqlite3
from datetime import date, datetime
from uuid import uuid4

app = Flask(__name__)
app.secret_key = "dev-secret-key"  # change this in production
DB_PATH = "jobs.db"

JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"]


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
            application_deadline TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Open',
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


@app.before_request
def ensure_db():
    init_db()


def require_employer():
    return session.get("role") == "employer"


@app.route("/")
def index():
    return render_template_string(
        """
        <!doctype html>
        <html>
        <head>
          <title>Job Portal MVP - Sprint 1</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 32px auto; padding: 0 16px; }
            .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
            a.button { display: inline-block; padding: 8px 12px; margin-right: 8px; text-decoration: none; border: 1px solid #444; border-radius: 8px; color: #111; }
            .msg { padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; }
            .err { background: #ffe7e7; border: 1px solid #f1b2b2; }
            .ok { background: #eaf7ea; border: 1px solid #b7e1b7; }
          </style>
        </head>
        <body>
          <h1>Job Portal (Sprint 1 MVP)</h1>

          {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
              {% for category, message in messages %}
                <div class="msg {{ 'err' if category == 'error' else 'ok' }}">{{ message }}</div>
              {% endfor %}
            {% endif %}
          {% endwith %}

          <div class="card">
            <h3>Session</h3>
            {% if session.get('role') == 'employer' %}
              <p><strong>Logged in as Employer:</strong> {{ session.get('employer_name') }} ({{ session.get('employer_id') }})</p>
              <a class="button" href="{{ url_for('new_job') }}">Post Job</a>
              <a class="button" href="{{ url_for('employer_jobs') }}">View My Posted Jobs</a>
              <a class="button" href="{{ url_for('logout') }}">Logout</a>
            {% else %}
              <p>Not logged in.</p>
              <a class="button" href="{{ url_for('login_employer') }}">Demo Login as Employer</a>
            {% endif %}
          </div>

          <div class="card">
            <h3>Sprint 1 Scope Included</h3>
            <ul>
              <li>Create and publish a job posting (basic fields)</li>
              <li>Validation of required inputs</li>
              <li>Date validation (deadline cannot be in the past)</li>
              <li>Save to database (SQLite)</li>
              <li>Show posted jobs list for the employer</li>
            </ul>
          </div>
        </body>
        </html>
        """
    )


@app.route("/login/employer")
def login_employer():
    session["role"] = "employer"
    session["employer_id"] = "EMP001"
    session["employer_name"] = "Acme HR"
    flash("Demo employer login successful.", "success")
    return redirect(url_for("index"))


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out.", "success")
    return redirect(url_for("index"))


@app.route("/jobs/new", methods=["GET", "POST"])
def new_job():
    if not require_employer():
        flash("Only employers can access the Post Job feature.", "error")
        return redirect(url_for("index"))

    form = {
        "title": "",
        "description": "",
        "location": "",
        "job_type": "",
        "application_deadline": "",
    }
    errors = []

    if request.method == "POST":
        form = {
            "title": request.form.get("title", "").strip(),
            "description": request.form.get("description", "").strip(),
            "location": request.form.get("location", "").strip(),
            "job_type": request.form.get("job_type", "").strip(),
            "application_deadline": request.form.get("application_deadline", "").strip(),
        }

        # Required field validation
        for field_name, value in form.items():
            if not value:
                errors.append(f"{field_name.replace('_', ' ').title()} is required.")

        # Job type validation
        if form["job_type"] and form["job_type"] not in JOB_TYPES:
            errors.append("Invalid job type selected.")

        # Deadline validation (format + not in the past)
        if form["application_deadline"]:
            try:
                deadline = datetime.strptime(form["application_deadline"], "%Y-%m-%d").date()
                if deadline < date.today():
                    errors.append("Application deadline cannot be earlier than today.")
            except ValueError:
                errors.append("Application deadline format is invalid.")

        if not errors:
            conn = get_conn()
            conn.execute(
                """
                INSERT INTO jobs (
                    job_id, employer_id, employer_name, title, description, location,
                    job_type, application_deadline, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "JOB-" + uuid4().hex[:8].upper(),
                    session["employer_id"],
                    session["employer_name"],
                    form["title"],
                    form["description"],
                    form["location"],
                    form["job_type"],
                    form["application_deadline"],
                    "Open",
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )
            conn.commit()
            conn.close()
            flash("Job posting created successfully (status: Open).", "success")
            return redirect(url_for("employer_jobs"))

    return render_template_string(
        """
        <!doctype html>
        <html>
        <head>
          <title>Post Job</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 32px auto; padding: 0 16px; }
            label { display: block; margin-top: 12px; font-weight: bold; }
            input, select, textarea { width: 100%; padding: 8px; margin-top: 6px; box-sizing: border-box; }
            textarea { min-height: 120px; }
            .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .error-list { background: #ffe7e7; border: 1px solid #f1b2b2; border-radius: 8px; padding: 12px; }
            .btn { margin-top: 16px; padding: 10px 14px; border-radius: 8px; border: 1px solid #333; cursor: pointer; }
            a { text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>Post a Job Opening</h1>
          <p>Logged in as: <strong>{{ session.get('employer_name') }}</strong> ({{ session.get('employer_id') }})</p>
          <p><a href="{{ url_for('index') }}">← Back to Home</a></p>

          {% if errors %}
            <div class="error-list">
              <strong>Please fix the following:</strong>
              <ul>
                {% for e in errors %}
                  <li>{{ e }}</li>
                {% endfor %}
              </ul>
            </div>
          {% endif %}

          <form method="post">
            <label for="title">Job Title *</label>
            <input id="title" name="title" value="{{ form.title }}" placeholder="e.g., Junior Software Engineer">

            <label for="description">Job Description *</label>
            <textarea id="description" name="description" placeholder="Responsibilities, requirements, etc.">{{ form.description }}</textarea>

            <div class="row">
              <div>
                <label for="location">Location *</label>
                <input id="location" name="location" value="{{ form.location }}" placeholder="e.g., Penang">
              </div>
              <div>
                <label for="job_type">Job Type *</label>
                <select id="job_type" name="job_type">
                  <option value="">-- Select --</option>
                  {% for jt in job_types %}
                    <option value="{{ jt }}" {% if form.job_type == jt %}selected{% endif %}>{{ jt }}</option>
                  {% endfor %}
                </select>
              </div>
            </div>

            <label for="application_deadline">Application Deadline *</label>
            <input id="application_deadline" type="date" name="application_deadline" value="{{ form.application_deadline }}">

            <button class="btn" type="submit">Publish Job</button>
          </form>
        </body>
        </html>
        """,
        form=form,
        errors=errors,
        job_types=JOB_TYPES,
    )


@app.route("/employer/jobs")
def employer_jobs():
    if not require_employer():
        flash("Only employers can view employer jobs.", "error")
        return redirect(url_for("index"))

    conn = get_conn()
    jobs = conn.execute(
        """
        SELECT job_id, title, location, job_type, application_deadline, status, created_at
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
        <html>
        <head>
          <title>My Posted Jobs</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 1000px; margin: 32px auto; padding: 0 16px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
            .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid #bbb; }
            .msg { padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; background: #eaf7ea; border: 1px solid #b7e1b7; }
          </style>
        </head>
        <body>
          <h1>My Posted Jobs</h1>
          <p><a href="{{ url_for('index') }}">← Home</a> | <a href="{{ url_for('new_job') }}">Post Another Job</a></p>

          {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
              {% for category, message in messages %}
                <div class="msg">{{ message }}</div>
              {% endfor %}
            {% endif %}
          {% endwith %}

          {% if jobs %}
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Job Type</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {% for job in jobs %}
                  <tr>
                    <td>{{ job["job_id"] }}</td>
                    <td>{{ job["title"] }}</td>
                    <td>{{ job["location"] }}</td>
                    <td>{{ job["job_type"] }}</td>
                    <td>{{ job["application_deadline"] }}</td>
                    <td><span class="pill">{{ job["status"] }}</span></td>
                    <td>{{ job["created_at"] }}</td>
                  </tr>
                {% endfor %}
              </tbody>
            </table>
          {% else %}
            <p>No job postings yet.</p>
          {% endif %}
        </body>
        </html>
        """,
        jobs=jobs,
    )


if __name__ == "__main__":
    app.run(debug=True)