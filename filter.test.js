const filterJobs = require('./filter');

const jobs = [
{title:"Frontend Developer", company:"TechSoft", location:"Kuala Lumpur", category:"Software Development"},
{title:"UI Designer", company:"DesignPro", location:"Johor", category:"Design"},
{title:"Data Analyst", company:"DataCorp", location:"KL", category:"Data"}
];

test("Filter by category", () => {

const result = filterJobs(jobs, "", "Design");

expect(result.length).toBe(1);
expect(result[0].title).toBe("UI Designer");

});

test("Filter by keyword", () => {

const result = filterJobs(jobs, "data", "All");

expect(result.length).toBe(1);
expect(result[0].title).toBe("Data Analyst");

});

test("Filter by keyword + category", () => {

const result = filterJobs(jobs, "frontend", "Software Development");

expect(result.length).toBe(1);

});

test("Return all jobs when category is All", () => {

const result = filterJobs(jobs, "", "All");

expect(result.length).toBe(3);

});