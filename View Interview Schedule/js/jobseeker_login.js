(function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("jobSeekerEmail");
  const passwordInput = document.getElementById("jobSeekerPassword");
  const toast = document.getElementById("toast");

  const SESSION_KEY = "jp_logged_in_jobseeker";

  function showToast(ok, msg) {
    toast.className = "toast " + (ok ? "toast--ok" : "toast--bad");
    toast.textContent = msg;
    toast.style.display = "block";
  }

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showToast(false, "Please enter both email and password.");
      return;
    }

    const users = getJobSeekerAccounts();
    const matchedUser = users.find(
      user => user.email.toLowerCase() === email && user.password === password
    );

    if (!matchedUser) {
      showToast(false, "Invalid email or password.");
      return;
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email
    }));

    showToast(true, "Login successful. Redirecting...");
    setTimeout(() => {
      window.location.href = "./jobseeker_interview_schedule.html";
    }, 500);
  });
})();