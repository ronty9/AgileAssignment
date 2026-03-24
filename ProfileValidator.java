

public class ProfileValidator {

    public ValidationResult validateProfile(JobSeekerProfile profile) {
        ValidationResult result = new ValidationResult();

        // 1. Validate Skills
        if (profile.getSkills() != null) {
            for (String skill : profile.getSkills()) {
                if (skill == null || skill.trim().isEmpty()) {
                    result.addError("Skill name cannot be empty.");
                }
            }
        }

        // 2. Validate Education 
        if (profile.getEducationList() != null) {
            for (JobSeekerProfile.Education edu : profile.getEducationList()) {
                if (isNullOrEmpty(edu.institution)) result.addError("Education institution is required.");
                if (isNullOrEmpty(edu.level)) result.addError("Education level is required.");
                if (isNullOrEmpty(edu.year)) {
                    result.addError("Education year is required.");
                } else {
                    try {
                        int yearInt = Integer.parseInt(edu.year);
                        if (yearInt < 1950 || yearInt > 2100) {
                            result.addError("Invalid education year.");
                        }
                    } catch (NumberFormatException e) {
                        result.addError("Education year must be a valid number.");
                    }
                }
            }
        }

        // 3. Validate Work Experience 
        if (profile.getExperienceList() != null) {
            for (JobSeekerProfile.Experience exp : profile.getExperienceList()) {
                if (isNullOrEmpty(exp.company)) result.addError("Company name is required.");
                if (isNullOrEmpty(exp.role)) result.addError("Job role is required.");
                if (isNullOrEmpty(exp.duration)) result.addError("Experience duration is required.");
            }
        }

        return result;
    }

    private boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
}