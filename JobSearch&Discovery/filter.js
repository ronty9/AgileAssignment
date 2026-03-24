function filterJobs(jobs, keyword, category){

    keyword = keyword.toLowerCase().trim();

    return jobs.filter(job => {

        const matchKeyword =
            job.title.toLowerCase().includes(keyword) ||
            job.company.toLowerCase().includes(keyword) ||
            job.location.toLowerCase().includes(keyword);

        const matchCategory =
            category === "All" || job.category === category;

        return matchKeyword && matchCategory;

    });

}

if (typeof window !== 'undefined') {
    window.filterJobs = filterJobs;
}

// for Jest (CI)
if (typeof module !== "undefined") {
    module.exports = filterJobs;
}