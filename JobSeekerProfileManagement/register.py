from __future__ import annotations

import re
import uuid
import hashlib
from dataclasses import dataclass
from datetime import datetime
from typing import Dict

from flask import Flask, request, render_template_string

app = Flask(__name__)

# -----------------------------
# Data Model + Repository
# -----------------------------
@dataclass(frozen=True)
class JobSeeker:
    id: str
    name: str
    email: str
    phone: str
    password_hash: str
    created_at: str


class JobSeekerRepository:
    def __init__(self) -> None:
        self._by_email: Dict[str, JobSeeker] = {}

    def exists_email(self, email: str) -> bool:
        return email.lower() in self._by_email

    def save(self, seeker: JobSeeker) -> None:
        self._by_email[seeker.email.lower()] = seeker


repo = JobSeekerRepository()

# -----------------------------
# Validation Helpers
# -----------------------------
EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email.strip()))

def normalize_phone(phone: str) -> str:
    return re.sub(r"\D", "", phone)

def is_valid_phone(phone: str) -> bool:
    digits = normalize_phone(phone)
    return digits.isdigit() and (10 <= len(digits) <= 11)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

# -----------------------------
# Register Function (User Story 1)
# -----------------------------
def register_job_seeker(name: str, email: str, phone: str, password: str, confirm_password: str):
    errors: Dict[str, str] = {}

    # 2) Required fields
    if not name.strip():
        errors["name"] = "Name is required."
    if not email.strip():
        errors["email"] = "Email is required."
    if not phone.strip():
        errors["phone"] = "Phone number is required."
    if not password:
        errors["password"] = "Password is required."
    if not confirm_password:
        errors["confirm_password"] = "Confirm password is required."

    if errors:
        return False, "Registration failed: required field is empty.", errors

    # 3) Email format validation
    if not is_valid_email(email):
        errors["email"] = "Invalid email format."
        return False, "Registration failed: invalid email format.", errors

    # 4) Email already exists
    if repo.exists_email(email):
        errors["email"] = "Email already exists in the system."
        return False, "Registration failed: email already exists.", errors

    # 5) Phone format validation
    if not is_valid_phone(phone):
        errors["phone"] = "Invalid phone number (must be 10–11 digits, no letters)."
        return False, "Registration failed: invalid phone number format.", errors

    # 6) Confirm password matches
    if confirm_password != password:
        errors["confirm_password"] = "Confirm password does not match the password."
        return False, "Registration failed: password mismatch.", errors

    # 7) Create account
    seeker = JobSeeker(
        id=str(uuid.uuid4()),
        name=name.strip(),
        email=email.strip(),
        phone=normalize_phone(phone),
        password_hash=hash_password(password),
        created_at=datetime.utcnow().isoformat()
    )
    repo.save(seeker)

    # 8) Success message + 9) proceed-to-login link in UI
    return True, "Registration successful! You may proceed to login.", {}

# -----------------------------
# UI (Centered, no image, blue button, English text)
# -----------------------------
REGISTER_HTML = """
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Register - Job Portal</title>
  <style>
    :root{
      --blue:#2d6cdf;
      --navy:#0f1b3d;
      --muted:#6b7280;
      --border:#dbe2ee;
      --bg:#f6f7fb;
    }
    *{ box-sizing:border-box; }
    body{
      margin:0;
      font-family: Arial, sans-serif;
      background:var(--bg);
      color:#1f2a44;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
    }

    .card{
      width:100%;
      max-width:560px;
      background:#fff;
      padding:28px;
      border-radius:16px;
      box-shadow:0 10px 30px rgba(0,0,0,.08);
    }

    /* logo */
    .logo{
      font-weight:800;
      font-size:56px;
      letter-spacing:.2px;
      line-height:1;
      margin:0;
      text-align:center;
    }
    .logo .my{ color:var(--blue); }
    .logo .jobs{ color:var(--navy); }
    .tagline{
      margin:6px 0 22px;
      color:var(--muted);
      font-style:italic;
      font-size:14px;
      text-align:center;
    }

    h2{
      margin:0 0 6px;
      font-size:22px;
      color:var(--navy);
      text-align:left;
    }
    .subtitle{
      margin:0 0 18px;
      color:var(--muted);
      font-size:14px;
    }

    label{
      display:block;
      margin-top:14px;
      font-size:14px;
      color:var(--navy);
      font-weight:700;
    }
    input{
      width:100%;
      padding:12px 14px;
      margin-top:8px;
      border:1px solid var(--border);
      border-radius:10px;
      font-size:14px;
      outline:none;
      background:#fff;
    }
    input:focus{
      border-color:#b9c6dd;
      box-shadow:0 0 0 3px rgba(45,108,223,.12);
    }

    .error{
      margin-top:6px;
      font-size:12px;
      color:#b00020;
    }

    .success{
      background:#e8f0ff;
      border:1px solid #c8dbff;
      color:#163b8a;
      padding:12px 14px;
      border-radius:10px;
      margin:0 0 14px;
      font-size:14px;
    }

    .btn{
      width:100%;
      margin-top:22px;
      padding:14px 16px;
      border:0;
      border-radius:999px;
      background:var(--blue);
      color:#fff;
      font-weight:800;
      cursor:pointer;
      font-size:14px;
    }
    .btn:hover{ filter:brightness(.98); }

    .back{
      margin-top:14px;
      text-align:center;
      font-size:14px;
    }
    .back a{
      color:var(--blue);
      text-decoration:none;
      font-weight:700;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="logo"><span class="my">MY</span>Future<span class="jobs">Jobs</span></h1>
    <div class="tagline">Your National Employment Services Provider</div>

    <h2>New Registration</h2>
    <p class="subtitle">Build your dream career here.</p>

    {% if success_message %}
      <div class="success">{{ success_message }}</div>
    {% endif %}

    <form method="POST" action="/register">
      <!-- ONLY required fields from User Story -->
      <label>Name*</label>
      <input name="name" value="{{ form.get('name','') if form else '' }}" placeholder="Example: Ali Bin Abu">
      {% if errors.get('name') %}<div class="error">{{ errors.get('name') }}</div>{% endif %}

      <label>Email Address*</label>
      <input name="email" value="{{ form.get('email','') if form else '' }}" placeholder="e.g. example@example.com">
      {% if errors.get('email') %}<div class="error">{{ errors.get('email') }}</div>{% endif %}

      <label>Phone Number*</label>
      <input name="phone" value="{{ form.get('phone','') if form else '' }}" placeholder="e.g. 0123456789">
      {% if errors.get('phone') %}<div class="error">{{ errors.get('phone') }}</div>{% endif %}

      <label>Password*</label>
      <input type="password" name="password" placeholder="Enter your password">
      {% if errors.get('password') %}<div class="error">{{ errors.get('password') }}</div>{% endif %}

      <label>Confirm Password*</label>
      <input type="password" name="confirm_password" placeholder="Re-enter your password">
      {% if errors.get('confirm_password') %}<div class="error">{{ errors.get('confirm_password') }}</div>{% endif %}

      <button class="btn" type="submit">Register</button>
    </form>

    <!-- Requirement 9: proceed to login link (no extra feature implemented) -->
    <div class="back">
      <a href="#">← Back to Login</a>
    </div>
  </div>
</body>
</html>
"""

# -----------------------------
# Routes (Register only)
# -----------------------------
@app.get("/")
def home():
    return render_template_string(REGISTER_HTML, errors={}, form=None, success_message=None)

@app.get("/register")
def register_page():
    return render_template_string(REGISTER_HTML, errors={}, form=None, success_message=None)

@app.post("/register")
def register_submit():
    form = request.form
    success, message, errors = register_job_seeker(
        name=form.get("name", ""),
        email=form.get("email", ""),
        phone=form.get("phone", ""),
        password=form.get("password", ""),
        confirm_password=form.get("confirm_password", "")
    )

    if success:
        return render_template_string(REGISTER_HTML, errors={}, form=None, success_message=message)

    return render_template_string(REGISTER_HTML, errors=errors, form=form, success_message=None)


if __name__ == "__main__":
    app.run(debug=True)