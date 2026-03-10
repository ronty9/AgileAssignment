const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// -----------------------------
// Database Initialization
// -----------------------------
const DB_NAME = 'job_portal.db';
const db = new sqlite3.Database(DB_NAME);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS job_seekers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    `);
});

// -----------------------------
// Validation Helpers
// -----------------------------
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email.trim());
}

function normalizePhone(phone) {
    return phone.replace(/\D/g, '');
}

function isValidPhone(phone) {
    const digits = normalizePhone(phone);
    return /^\d+$/.test(digits) && digits.length >= 10 && digits.length <= 11;
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// -----------------------------
// UI Template Function
// -----------------------------
function renderHTML(errors = {}, form = {}, successMessage = null) {
    return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Register - Job Portal</title>
      <style>
        :root{ --blue:#2d6cdf; --navy:#0f1b3d; --muted:#6b7280; --border:#dbe2ee; --bg:#f6f7fb; }
        *{ box-sizing:border-box; }
        body{ margin:0; font-family: Arial, sans-serif; background:var(--bg); color:#1f2a44; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
        .card{ width:100%; max-width:560px; background:#fff; padding:28px; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.08); }
        .logo{ font-weight:800; font-size:56px; letter-spacing:.2px; line-height:1; margin:0; text-align:center; }
        .logo .my{ color:var(--blue); }
        .logo .jobs{ color:var(--navy); }
        .tagline{ margin:6px 0 22px; color:var(--muted); font-style:italic; font-size:14px; text-align:center; }
        h2{ margin:0 0 6px; font-size:22px; color:var(--navy); text-align:left; }
        .subtitle{ margin:0 0 18px; color:var(--muted); font-size:14px; }
        label{ display:block; margin-top:14px; font-size:14px; color:var(--navy); font-weight:700; }
        input{ width:100%; padding:12px 14px; margin-top:8px; border:1px solid var(--border); border-radius:10px; font-size:14px; outline:none; background:#fff; }
        input:focus{ border-color:#b9c6dd; box-shadow:0 0 0 3px rgba(45,108,223,.12); }
        .error{ margin-top:6px; font-size:12px; color:#b00020; }
        .success{ background:#e8f0ff; border:1px solid #c8dbff; color:#163b8a; padding:12px 14px; border-radius:10px; margin:0 0 14px; font-size:14px; }
        .btn{ width:100%; margin-top:22px; padding:14px 16px; border:0; border-radius:999px; background:var(--blue); color:#fff; font-weight:800; cursor:pointer; font-size:14px; }
        .btn:hover{ filter:brightness(.98); }
        .back{ margin-top:14px; text-align:center; font-size:14px; }
        .back a{ color:var(--blue); text-decoration:none; font-weight:700; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1 class="logo"><span class="my">MY</span>Future<span class="jobs">Jobs</span></h1>
        <div class="tagline">Your National Employment Services Provider</div>
        <h2>New Registration</h2>
        <p class="subtitle">Build your dream career here.</p>
        
        ${successMessage ? `<div class="success">${successMessage}</div>` : ''}
        
        <form method="POST" action="/register">
          <label>Name*</label>
          <input name="name" value="${form.name || ''}" placeholder="Example: Ali Bin Abu">
          ${errors.name ? `<div class="error">${errors.name}</div>` : ''}

          <label>Email Address*</label>
          <input name="email" value="${form.email || ''}" placeholder="e.g. example@example.com">
          ${errors.email ? `<div class="error">${errors.email}</div>` : ''}

          <label>Phone Number*</label>
          <input name="phone" value="${form.phone || ''}" placeholder="e.g. 0123456789">
          ${errors.phone ? `<div class="error">${errors.phone}</div>` : ''}

          <label>Password*</label>
          <input type="password" name="password" placeholder="Enter your password">
          ${errors.password ? `<div class="error">${errors.password}</div>` : ''}

          <label>Confirm Password*</label>
          <input type="password" name="confirm_password" placeholder="Re-enter your password">
          ${errors.confirm_password ? `<div class="error">${errors.confirm_password}</div>` : ''}

          <button class="btn" type="submit">Register</button>
        </form>
        <div class="back"><a href="/login">← Back to Login</a></div>
      </div>
    </body>
    </html>
    `;
}

// -----------------------------
// Routes
// -----------------------------
app.get('/', (req, res) => {
    res.send(renderHTML());
});

app.get('/register', (req, res) => {
    res.send(renderHTML());
});

app.post('/register', (req, res) => {
    const { name = '', email = '', phone = '', password = '', confirm_password = '' } = req.body;
    const errors = {};

    // 2) Required fields validation
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (!password) errors.password = "Password is required.";
    if (!confirm_password) errors.confirm_password = "Confirm password is required.";

    if (Object.keys(errors).length > 0) {
        return res.send(renderHTML(errors, req.body));
    }

    // 3) Email format validation
    if (!isValidEmail(email)) {
        errors.email = "Invalid email format.";
        return res.send(renderHTML(errors, req.body));
    }

    // 5) Phone format validation
    if (!isValidPhone(phone)) {
        errors.phone = "Invalid phone number (must be 10–11 digits, no letters).";
        return res.send(renderHTML(errors, req.body));
    }

    // 6) Confirm password matches
    if (confirm_password !== password) {
        errors.confirm_password = "Confirm password does not match the password.";
        return res.send(renderHTML(errors, req.body));
    }

    // 4) Check if email exists & 7) Save to DB
    db.get('SELECT 1 FROM job_seekers WHERE LOWER(email) = LOWER(?)', [email.trim()], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        if (row) {
            errors.email = "Email already exists in the system.";
            return res.send(renderHTML(errors, req.body));
        }

        const id = crypto.randomUUID();
        const normalizedPhone = normalizePhone(phone);
        const passwordHash = hashPassword(password);
        const createdAt = new Date().toISOString();

        db.run(`
            INSERT INTO job_seekers (id, name, email, phone, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id, name.trim(), email.trim(), normalizedPhone, passwordHash, createdAt], function(insertErr) {
            if (insertErr) {
                console.error(insertErr);
                return res.status(500).send("Error saving to database");
            }
            // 8) Success message
            res.send(renderHTML({}, {}, "Registration successful! You may proceed to login."));
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});