import os
import hashlib
import sqlite3
import uuid
from datetime import datetime
from flask import Flask, request, render_template, redirect, url_for, session

# Tell Flask to look for HTML templates in the current directory ('.')
app = Flask(__name__, template_folder='.')
app.secret_key = "super_secret_key_for_login"

DB_NAME = "job_portal.db"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    """Python creates and manages the database entirely on its own."""
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_seekers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Inject Demo Account
        demo_email = "mingshi0125@gmail.com"
        demo_password = "123456"
        
        cursor.execute('SELECT 1 FROM job_seekers WHERE email = ?', (demo_email,))
        if not cursor.fetchone():
            cursor.execute('''
                INSERT INTO job_seekers (id, name, email, phone, password_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()), "Demo Tester", demo_email, "0123456789", 
                hash_password(demo_password), datetime.utcnow().isoformat()
            ))
        conn.commit()

# -----------------------------
# Functions & Routes
# -----------------------------
@app.before_request
def startup():
    init_db()

@app.get("/")
def index():
    return redirect(url_for('login_page'))

@app.get("/login")
def login_page():
    if "user_id" in session:
        return redirect(url_for('home_page'))
    # Flask will now find this file in the current folder
    return render_template('login.html', errors={}, form={}, error_message=None)

@app.post("/login")
def login_submit():
    form = request.form
    email = form.get("email", "")
    password = form.get("password", "")
    errors = {}
    
    if not email.strip(): errors["email"] = "Email is required."
    if not password: errors["password"] = "Password is required."
    if errors:
        return render_template('login.html', errors=errors, form=form, error_message="Login failed.")

    # Python talks directly to the SQLite Database
    with sqlite3.connect(DB_NAME) as conn:
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM job_seekers WHERE LOWER(email) = LOWER(?)', (email.strip(),))
        user = cursor.fetchone()

    # Validation
    if not user:
        errors["email"] = "This email is not registered in our system."
        return render_template('login.html', errors=errors, form=form, error_message="Login failed.")
    
    if dict(user)['password_hash'] != hash_password(password):
        errors["password"] = "Incorrect password."
        return render_template('login.html', errors=errors, form=form, error_message="Login failed.")

    # Success
    session["user_id"] = dict(user)["id"]
    session["user_name"] = dict(user)["name"]
    return redirect(url_for('home_page'))

@app.get("/home")
def home_page():
    if "user_id" not in session:
        return redirect(url_for('login_page'))
    # Flask will now find this file in the current folder
    return render_template('home.html')

@app.post("/logout")
def logout():
    session.clear()
    return redirect(url_for('login_page'))

if __name__ == "__main__":

    app.run(debug=True, port=5001)
