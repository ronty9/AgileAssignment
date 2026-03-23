document.addEventListener("DOMContentLoaded", function() {
    // Add initial empty rows if creating from scratch
    addSkill();
    addEducation();
    addExperience();
});

// --- Skills Management ---
function addSkill() {
    const container = document.getElementById('skills-container');
    const skillRow = document.createElement('div');
    skillRow.className = 'input-row';
    skillRow.innerHTML = `
        <input type="text" name="skillName" placeholder="e.g. Java, Agile" required>
        <button type="button" class="btn-remove" onclick="removeRow(this)">X</button>
    `;
    container.appendChild(skillRow);
}

// --- Education Management ---
function addEducation() {
    const container = document.getElementById('education-container');
    const eduRow = document.createElement('div');
    eduRow.className = 'input-row';
    eduRow.innerHTML = `
        <input type="text" name="eduInstitution" placeholder="Institution Name" required>
        <input type="text" name="eduLevel" placeholder="Level (e.g. Bachelor)" required>
        <input type="number" name="eduYear" placeholder="Graduation Year" min="1950" max="2100" required>
        <button type="button" class="btn-remove" onclick="removeRow(this)">X</button>
    `;
    container.appendChild(eduRow);
}

// --- Experience Management ---
function addExperience() {
    const container = document.getElementById('experience-container');
    const expRow = document.createElement('div');
    expRow.className = 'input-row';
    expRow.innerHTML = `
        <input type="text" name="expCompany" placeholder="Company Name" required>
        <input type="text" name="expRole" placeholder="Job Role" required>
        <input type="text" name="expDuration" placeholder="Duration (e.g. 2023-2025)" required>
        <button type="button" class="btn-remove" onclick="removeRow(this)">X</button>
    `;
    container.appendChild(expRow);
}

// --- Universal Remove Row ---
function removeRow(buttonElement) {
    buttonElement.parentElement.remove();
}

// --- Form Submission & Validation ---
document.getElementById('editProfileForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default submission
    
    // Client-side basic check is handled by HTML 'required' attributes.
    // Here you would typically gather the data into a JSON object 
    // and send it via fetch() to your Java backend (Servlet/Controller).
    
    document.getElementById('message-box').innerHTML = 
        `<p style="color: green;">Profile details updated successfully!</p>`;
});