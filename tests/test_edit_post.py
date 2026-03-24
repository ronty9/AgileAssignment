import os
import tempfile
import unittest
from datetime import date, datetime, timedelta

import app as app_module


class EditJobPostTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_jobs.db")

        app_module.DB_PATH = self.db_path
        app_module.init_db()

        app_module.app.config["TESTING"] = True
        self.client = app_module.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def _login_employer(self, employer_id="EMP001", employer_name="Acme HR"):
        with self.client.session_transaction() as sess:
            sess["role"] = "employer"
            sess["employer_id"] = employer_id
            sess["employer_name"] = employer_name

    def _insert_job(self, job_id="JOB-EDIT01", employer_id="EMP001"):
        deadline = (date.today() + timedelta(days=30)).strftime("%Y-%m-%d")
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn = app_module.get_conn()
        conn.execute(
            """
            INSERT INTO jobs (
                job_id, employer_id, employer_name, title, description, requirements,
                location, job_type, industry, application_deadline, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id,
                employer_id,
                "Acme HR",
                "Junior Backend Developer",
                "Build and maintain backend APIs with the engineering team.",
                "Experience in Python, REST APIs, and SQL databases.",
                "Penang",
                "Full-time",
                "Technology & IT",
                deadline,
                "Open",
                created_at,
            ),
        )
        conn.commit()
        conn.close()

    def _fetch_job(self, job_id):
        conn = app_module.get_conn()
        row = conn.execute(
            """
            SELECT title, description, requirements, location, job_type,
                   industry, application_deadline, status
            FROM jobs
            WHERE job_id = ?
            """,
            (job_id,),
        ).fetchone()
        conn.close()
        return row

    def test_edit_route_requires_employer_login(self):
        response = self.client.get("/jobs/JOB-EDIT01/edit", follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Only an authenticated employer can edit job postings.", response.data)

    def test_edit_form_loads_prefilled_values_for_owner(self):
        self._login_employer()
        self._insert_job(job_id="JOB-EDIT02", employer_id="EMP001")

        response = self.client.get("/jobs/JOB-EDIT02/edit")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Edit Job Posting", response.data)
        self.assertIn(b"Junior Backend Developer", response.data)
        self.assertIn(b"Experience in Python, REST APIs, and SQL databases.", response.data)

    def test_successful_edit_updates_job_details(self):
        self._login_employer()
        self._insert_job(job_id="JOB-EDIT03", employer_id="EMP001")

        new_deadline = (date.today() + timedelta(days=45)).strftime("%Y-%m-%d")
        response = self.client.post(
            "/jobs/JOB-EDIT03/edit",
            data={
                "title": "Backend Engineer",
                "description": "Lead API design and improve service performance in production.",
                "requirements": "Strong Python, SQL optimization, and cloud deployment experience.",
                "location": "Kuala Lumpur",
                "job_type": "Full-time",
                "industry": "Technology & IT",
                "application_deadline": new_deadline,
            },
            follow_redirects=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Backend Engineer", response.data)
        self.assertIn(b"About the Role", response.data)

        updated = self._fetch_job("JOB-EDIT03")
        self.assertEqual(updated["title"], "Backend Engineer")
        self.assertEqual(updated["location"], "Kuala Lumpur")
        self.assertEqual(updated["application_deadline"], new_deadline)

    def test_edit_with_invalid_data_shows_errors_and_does_not_update(self):
        self._login_employer()
        self._insert_job(job_id="JOB-EDIT04", employer_id="EMP001")

        past_deadline = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.post(
            "/jobs/JOB-EDIT04/edit",
            data={
                "title": "Backend Engineer",
                "description": "too short",
                "requirements": "also short",
                "location": "Kuala Lumpur",
                "job_type": "Full-time",
                "industry": "Technology & IT",
                "application_deadline": past_deadline,
            },
            follow_redirects=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Please fix the following errors before submitting", response.data)
        self.assertIn(b"Job Description must be at least", response.data)

        unchanged = self._fetch_job("JOB-EDIT04")
        self.assertEqual(unchanged["title"], "Junior Backend Developer")

    def test_edit_with_no_changes_returns_no_change_message(self):
        self._login_employer()
        self._insert_job(job_id="JOB-EDIT05", employer_id="EMP001")

        existing = self._fetch_job("JOB-EDIT05")
        response = self.client.post(
            "/jobs/JOB-EDIT05/edit",
            data={
                "title": existing["title"],
                "description": existing["description"],
                "requirements": existing["requirements"],
                "location": existing["location"],
                "job_type": existing["job_type"],
                "industry": existing["industry"],
                "application_deadline": existing["application_deadline"],
            },
            follow_redirects=True,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Junior Backend Developer", response.data)
        self.assertIn(b"About the Role", response.data)

        unchanged = self._fetch_job("JOB-EDIT05")
        self.assertEqual(unchanged["title"], "Junior Backend Developer")

    def test_edit_fails_for_non_owner(self):
        self._login_employer(employer_id="EMP001")
        self._insert_job(job_id="JOB-EDIT06", employer_id="EMP999")

        response = self.client.get("/jobs/JOB-EDIT06/edit", follow_redirects=True)

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Job not found or you do not have permission to edit it.", response.data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
