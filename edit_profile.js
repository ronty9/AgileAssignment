// js/edit_profile.js

document.addEventListener("DOMContentLoaded", function() {
    // 1. Verify authenticated user
    const userName = sessionStorage.getItem("userName");
    
    // If no user is logged in, kick them back to login page
    if (!userName) {
        window.location.href = "login.html";
        return; 
    }
    
    // Split the name correctly for the demo
    const nameParts = userName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || ""; 
    
    // Inject Basic Data
    document.getElementById("fName").value = firstName;
    document.getElementById("lName").value = lastName;
    document.getElementById("email").value = "mingshi0125@gmail.com";
    
    // Load saved phone number (or default)
    document.getElementById("phone").value = sessionStorage.getItem("userPhone") || "0123456789";

    // --- Load saved Dynamic Lists ---
    // Load Skills
    const savedSkills = JSON.parse(sessionStorage.getItem("userSkills") || "[]");
    if (savedSkills.length > 0) {
        savedSkills.forEach(skill => addSkillRow(skill));
    }

    // Load Education
    const savedEdu = JSON.parse(sessionStorage.getItem("userEdu") || "[]");
    if (savedEdu.length > 0) {
        savedEdu.forEach(edu => addEduRow(edu.inst, edu.lvl, edu.yr));
    }

    // Load Experience
    const savedExp = JSON.parse(sessionStorage.getItem("userExp") || "[]");
    if (savedExp.length > 0) {
        savedExp.forEach(exp => addExpRow(exp.comp, exp.role, exp.dur));
    }
});

// --- Dynamic Rows (Now accepting pre-filled values) ---
function addSkillRow(val = "") {
    const container = document.getElementById("skillsContainer");
    const div = document.createElement("div");
    div.className = "list-item skill-row";
    div.innerHTML = `
        <input type="text" class="skill-input" placeholder="e.g. Java, UI/UX" maxlength="50" value="${val}">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

// js/edit_profile.js

// --- Updated Dynamic Education Row with Selection Menu ---
function addEduRow(inst = "", lvl = "", yr = "") {
    const container = document.getElementById("eduContainer");
    const div = document.createElement("div");
    div.className = "list-item edu-row";
    
    // We create the full HTML structure including the selection menu
    div.innerHTML = `
        <input type="text" class="edu-inst" placeholder="Institution" maxlength="100" value="${inst}">
        
        <select class="edu-lvl">
            <option value="" disabled selected>Select Level</option>
            <option value="High School">High School Diploma or Equivalent</option>
            <option value="Associate">Associate Degree</option>
            <option value="Bachelor">Bachelor Degree</option>
            <option value="Master">Master's Degree</option>
            <option value="Doctoral">Doctoral Degree (PhD)</option>
            <option value="Professional">Professional Degree</option>
        </select>
        
        <input type="number" class="edu-yr" placeholder="Year" style="width: 100px;" value="${yr}">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    
    container.appendChild(div);

    // CRITICAL: If data is being pre-filled, we need to make sure the correct option is selected
    if (lvl) {
        // Find the select element inside the new div and set its value
        const selectElement = div.querySelector(".edu-lvl");
        selectElement.value = lvl; 
    }
}
function addExpRow(comp = "", role = "", dur = "") {
    const container = document.getElementById("expContainer");
    const div = document.createElement("div");
    div.className = "list-item exp-row";
    div.innerHTML = `
        <input type="text" class="exp-comp" placeholder="Company" maxlength="100" value="${comp}">
        <input type="text" class="exp-role" placeholder="Role" maxlength="50" value="${role}">
        <input type="text" class="exp-dur" placeholder="Duration" maxlength="30" value="${dur}">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

// --- Validation Logic ---
document.getElementById("editForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const errorBox = document.getElementById("errorBox");
    const successBox = document.getElementById("successBox");
    errorBox.style.display = "none";
    successBox.style.display = "none";
    
    // Clear all previous red error borders
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    
    let errors = [];

    // --- 1. Validate Basic Info ---
    const fNameInput = document.getElementById("fName");
    const lNameInput = document.getElementById("lName");
    const phoneInput = document.getElementById("phone");

    if (!fNameInput.value.trim()) {
        errors.push("First Name cannot be empty.");
        fNameInput.classList.add("input-error");
    }
    if (!lNameInput.value.trim()) {
        errors.push("Last Name cannot be empty.");
        lNameInput.classList.add("input-error");
    }
    if (!phoneInput.value.trim()) {
        errors.push("Contact Number cannot be empty.");
        phoneInput.classList.add("input-error");
    }

    // --- 2. Validate Skills ---
    const skills = document.querySelectorAll(".skill-input");
    skills.forEach(input => {
        if (!input.value.trim()) {
            errors.push("Skill fields cannot be left blank.");
            input.classList.add("input-error");
        }
    });

    // --- 3. Validate Education (WITH FUTURE YEAR CHECK) ---
    const edus = document.querySelectorAll(".edu-row");
    const currentYear = new Date().getFullYear(); // Automatically gets the current year (e.g., 2026)
    
    edus.forEach(row => {
        const instInput = row.querySelector(".edu-inst");
        const lvlInput = row.querySelector(".edu-lvl");
        const yrInput = row.querySelector(".edu-yr");
        
        if (!instInput.value.trim()) { errors.push("Education Institution is required."); instInput.classList.add("input-error"); }
        if (!lvlInput.value.trim()) { errors.push("Education Level is required."); lvlInput.classList.add("input-error"); }
        
        const yearValue = parseInt(yrInput.value.trim());
        if (!yrInput.value.trim()) {
            errors.push("Education Year is required.");
            yrInput.classList.add("input-error");
        } else if (yearValue < 1950 || yearValue > currentYear) {
            // Error message dynamically updates based on the current year!
            errors.push(`Invalid education year (must be between 1950 and ${currentYear}).`);
            yrInput.classList.add("input-error");
        }
    });

    // --- 4. Validate Experience ---
    const exps = document.querySelectorAll(".exp-row");
    exps.forEach(row => {
        const compInput = row.querySelector(".exp-comp");
        const roleInput = row.querySelector(".exp-role");
        const durInput = row.querySelector(".exp-dur");

        if (!compInput.value.trim()) { errors.push("Company name is required."); compInput.classList.add("input-error"); }
        if (!roleInput.value.trim()) { errors.push("Job role is required."); roleInput.classList.add("input-error"); }
        if (!durInput.value.trim()) { errors.push("Experience duration is required."); durInput.classList.add("input-error"); }
    });

    // --- Show Results & Save ---
    if (errors.length > 0) {
        const uniqueErrors = [...new Set(errors)];
        errorBox.innerHTML = "<strong>Please fix the following:</strong><br>• " + uniqueErrors.join("<br>• ");
        errorBox.style.display = "block";
        window.scrollTo(0, 0); 
    } else {
        successBox.style.display = "block";
        window.scrollTo(0, 0);
        
        // Save Basic Info
        const newName = fNameInput.value + " " + lNameInput.value;
        sessionStorage.setItem("userName", newName.trim());
        sessionStorage.setItem("userPhone", phoneInput.value.trim());

        // Save Skills
        const skillsArray = [];
        document.querySelectorAll(".skill-input").forEach(input => {
            skillsArray.push(input.value.trim());
        });
        sessionStorage.setItem("userSkills", JSON.stringify(skillsArray));

        // Save Education
        const eduArray = [];
        document.querySelectorAll(".edu-row").forEach(row => {
            eduArray.push({
                inst: row.querySelector(".edu-inst").value.trim(),
                lvl: row.querySelector(".edu-lvl").value.trim(),
                yr: row.querySelector(".edu-yr").value.trim()
            });
        });
        sessionStorage.setItem("userEdu", JSON.stringify(eduArray));

        // Save Experience
        const expArray = [];
        document.querySelectorAll(".exp-row").forEach(row => {
            expArray.push({
                comp: row.querySelector(".exp-comp").value.trim(),
                role: row.querySelector(".exp-role").value.trim(),
                dur: row.querySelector(".exp-dur").value.trim()
            });
        });
        sessionStorage.setItem("userExp", JSON.stringify(expArray));
        
        // Redirect back to profile view after 1.5 seconds
        setTimeout(() => { window.location.href = "profile.html"; }, 1500);
    }
});