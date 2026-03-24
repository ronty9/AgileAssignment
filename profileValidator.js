// js/profileValidator.js

function validateProfileData(data) {
    let errors = [];
    const currentYear = new Date().getFullYear();

    // Validate Basic Info
    if (!data.fName || !data.fName.trim()) errors.push("First Name cannot be empty.");
    if (!data.lName || !data.lName.trim()) errors.push("Last Name cannot be empty.");
    if (!data.phone || !data.phone.trim()) errors.push("Contact Number cannot be empty.");

    // Validate Skills
    if (data.skills) {
        data.skills.forEach(skill => {
            if (!skill.trim()) errors.push("Skill fields cannot be left blank.");
        });
    }

    // Validate Education & Invalid Years
    if (data.edus) {
        data.edus.forEach(edu => {
            if (!edu.inst.trim()) errors.push("Education Institution is required.");
            if (!edu.lvl.trim()) errors.push("Education Level is required.");
            
            const yearValue = parseInt(edu.yr.trim());
            if (!edu.yr.trim()) {
                errors.push("Education Year is required.");
            } else if (yearValue < 1950 || yearValue > currentYear) {
                errors.push(`Invalid education year (must be between 1950 and ${currentYear}).`);
            }
        });
    }

    return errors;
}

// Export the function so the Jest testing framework can read it
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validateProfileData };
}