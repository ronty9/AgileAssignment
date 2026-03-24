

import java.util.List;

public class JobSeekerProfile {
    private List<String> skills;
    private List<Education> educationList;
    private List<Experience> experienceList;

    // Getters and Setters
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<Education> getEducationList() { return educationList; }
    public void setEducationList(List<Education> educationList) { this.educationList = educationList; }

    public List<Experience> getExperienceList() { return experienceList; }
    public void setExperienceList(List<Experience> experienceList) { this.experienceList = experienceList; }

    // Nested Classes for Education and Experience 
    public static class Education {
        public String institution;
        public String level;
        public String year;
        
        public Education(String institution, String level, String year) {
            this.institution = institution;
            this.level = level;
            this.year = year;
        }
    }

    public static class Experience {
        public String company;
        public String role;
        public String duration;
        
        public Experience(String company, String role, String duration) {
            this.company = company;
            this.role = role;
            this.duration = duration;
        }
    }
}