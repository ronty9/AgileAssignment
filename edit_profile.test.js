// js/edit_profile.test.js
const { validateProfileData } = require('./profileValidator');

describe("User Story 3: Edit Profile Validation Tests", () => {
    
    // POSITIVE TEST: Complete and valid profile
    test("Should return no errors for a fully valid profile", () => {
        const validData = {
            fName: "Ng",
            lName: "Ming Shi",
            phone: "0123456789",
            skills: ["Java", "Flutter"],
            edus: [{ inst: "TAR UMT", lvl: "Degree", yr: "2024" }]
        };
        
        const errors = validateProfileData(validData);
        expect(errors.length).toBe(0); // 0 errors means it passed!
    });

    // NEGATIVE TEST (Criteria 6): Required fields left empty
    test("Should return errors if required basic fields are left empty", () => {
        const emptyData = {
            fName: "", 
            lName: "", 
            phone: "",
            skills: [],
            edus: []
        };
        
        const errors = validateProfileData(emptyData);
        expect(errors).toContain("First Name cannot be empty.");
        expect(errors).toContain("Last Name cannot be empty.");
        expect(errors).toContain("Contact Number cannot be empty.");
    });

    // NEGATIVE TEST (Criteria 4): Invalid Years
    test("Should prevent user from entering an invalid future education year", () => {
        const currentYear = new Date().getFullYear();
        const futureYearData = {
            fName: "Ng", lName: "Ming Shi", phone: "0123456789",
            skills: ["Java"],
            edus: [{ inst: "TAR UMT", lvl: "Degree", yr: "2050" }] // Invalid Future Year
        };
        
        const errors = validateProfileData(futureYearData);
        expect(errors).toContain(`Invalid education year (must be between 1950 and ${currentYear}).`);
    });

    // NEGATIVE TEST (Criteria 6): Empty Education Fields
    test("Should return errors if education fields are blank", () => {
        const badEduData = {
            fName: "Ng", lName: "Ming Shi", phone: "0123456789",
            skills: ["Java"],
            edus: [{ inst: "", lvl: "", yr: "" }] // Missing all edu details
        };
        
        const errors = validateProfileData(badEduData);
        expect(errors).toContain("Education Institution is required.");
        expect(errors).toContain("Education Level is required.");
        expect(errors).toContain("Education Year is required.");
    });
});