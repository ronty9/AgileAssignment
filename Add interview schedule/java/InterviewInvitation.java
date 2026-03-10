import java.time.LocalDateTime;

public class InterviewInvitation {

    private final String employerId;
    private final String applicantId;
    private final String jobId;

    private final InterviewType type;
    private final LocalDateTime interviewDateTime;

    private final String location;     // required if PHYSICAL
    private final String meetingLink;  // required if ONLINE
    private final String notes;        // optional

    public InterviewInvitation(
            String employerId,
            String applicantId,
            String jobId,
            InterviewType type,
            LocalDateTime interviewDateTime,
            String location,
            String meetingLink,
            String notes
    ) {
        this.employerId = employerId;
        this.applicantId = applicantId;
        this.jobId = jobId;
        this.type = type;
        this.interviewDateTime = interviewDateTime;
        this.location = location;
        this.meetingLink = meetingLink;
        this.notes = notes;
    }

    public String getEmployerId() { return employerId; }
    public String getApplicantId() { return applicantId; }
    public String getJobId() { return jobId; }
    public InterviewType getType() { return type; }
    public LocalDateTime getInterviewDateTime() { return interviewDateTime; }
    public String getLocation() { return location; }
    public String getMeetingLink() { return meetingLink; }
    public String getNotes() { return notes; }
}