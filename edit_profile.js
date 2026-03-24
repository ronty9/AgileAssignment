// js/edit_profile.js

document.addEventListener("DOMContentLoaded", function() {
    // Requirement 1: Verify authenticated user
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
    
    // Inject data
    document.getElementById("fName").value = firstName;
    document.getElementById("lName").value = lastName;
    document.getElementById("email").value = "mingshi0125@gmail.com";
    document.getElementById("phone").value = "0123456789";
});

// --- Dynamic Rows ---
function addSkillRow() {
    const container = document.getElementById("skillsContainer");
    const div = document.createElement("div");
    div.className = "list-item skill-row";
    div.innerHTML = `
        <input type="text" class="skill-input" placeholder="e.g. Java, UI/UX" maxlength="50">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

function addEduRow() {
    const container = document.getElementById("eduContainer");
    const div = document.createElement("div");
    div.className = "list-item edu-row";
    // Requirement 3: Institution, Level, and Year
    div.innerHTML = `
        <input type="text" class="edu-inst" placeholder="Institution" maxlength="100">
        <input type="text" class="edu-lvl" placeholder="Level (e.g. Degree)" maxlength="50">
        <input type="number" class="edu-yr" placeholder="Year" style="width: 100px;">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

function addExpRow() {
    const container = document.getElementById("expContainer");
    const div = document.createElement("div");
    div.className = "list-item exp-row";
    // Requirement 5: Company, Role, and Duration
    div.innerHTML = `
        <input type="text" class="exp-comp" placeholder="Company" maxlength="100">
        <input type="text" class="exp-role" placeholder="Role" maxlength="50">
        <input type="text" class="exp-dur" placeholder="Duration" maxlength="30">
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
    
    let errors = [];

    if (!document.getElementById("fName").value.trim()) errors.push("First Name cannot be empty.");

    // Requirement 2: Validate Skills
    const skills = document.querySelectorAll(".skill-input");
    skills.forEach(input => {
        if (!input.value.trim()) errors.push("Skill fields cannot be left blank.");
    });

    // Requirement 6: Validate Education fields
    const edus = document.querySelectorAll(".edu-row");
    edus.forEach(row => {
        const inst = row.querySelector(".edu-inst").value.trim();
        const lvl = row.querySelector(".edu-lvl").value.trim();
        const yr = row.querySelector(".edu-yr").value.trim();
        
        if (!inst) errors.push("Education Institution is required.");
        if (!lvl) errors.push("Education Level is required.");
        
        // Requirement 4: Prevent invalid years
        if (!yr) {
            errors.push("Education Year is required.");
        } else if (parseInt(yr) < 1950 || parseInt(yr) > 2100) {
            errors.push("Invalid education year.");
        }
    });

    // Requirement 6: Validate Experience fields
    const exps = document.querySelectorAll(".exp-row");
    exps.forEach(row => {
        const comp = row.querySelector(".exp-comp").value.trim();
        const role = row.querySelector(".exp-role").value.trim();
        const dur = row.querySelector(".exp-dur").value.trim();

        if (!comp) errors.push("Company name is required.");
        if (!role) errors.push("Job role is required.");
        if (!dur) errors.push("Experience duration is required.");
    });

    // Show Results
    if (errors.length > 0) {
        const uniqueErrors = [...new Set(errors)];
        errorBox.innerHTML = "<strong>Please fix the following:</strong><br>• " + uniqueErrors.join("<br>• ");
        errorBox.style.display = "block";
        window.scrollTo(0, 0); // Scroll up so user sees the error
    } else {
        // Requirement 10: Success Message immediately displayed
        successBox.style.display = "block";
        window.scrollTo(0, 0);
        
        // Requirement 9: Save Updates (Update Session Name)
        const newName = document.getElementById("fName").value + " " + document.getElementById("lName").value;
        sessionStorage.setItem("userName", newName.trim());
        
        setTimeout(() => { window.location.href = "profile.html"; }, 1500);
    }
});