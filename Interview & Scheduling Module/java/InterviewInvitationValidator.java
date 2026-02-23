import java.net.MalformedURLException;
import java.net.URL;
import java.time.Clock;
import java.time.LocalDateTime;

public class InterviewInvitationValidator {

    private final Clock clock;

    // Inject Clock so we can unit test "past/future" easily (TDD friendly).
    public InterviewInvitationValidator(Clock clock) {
        this.clock = clock;
    }

    public ValidationResult validate(InterviewInvitation invitation) {
        ValidationResult result = new ValidationResult();

        if (isBlank(invitation.getEmployerId())) {
            result.addError("Employer ID is required.");
        }
        if (isBlank(invitation.getApplicantId())) {
            result.addError("Applicant ID is required.");
        }
        if (isBlank(invitation.getJobId())) {
            result.addError("Job ID is required.");
        }
        if (invitation.getType() == null) {
            result.addError("Interview type is required.");
        }
        if (invitation.getInterviewDateTime() == null) {
            result.addError("Interview date/time is required.");
        } else {
            LocalDateTime now = LocalDateTime.now(clock);
            if (invitation.getInterviewDateTime().isBefore(now)) {
                result.addError("Interview date/time cannot be in the past.");
            }
        }

        // Type-specific requirements
        if (invitation.getType() == InterviewType.ONLINE) {
            if (isBlank(invitation.getMeetingLink())) {
                result.addError("Meeting link is required for online interview.");
            } else if (!isValidHttpUrl(invitation.getMeetingLink())) {
                result.addError("Meeting link must be a valid http/https URL.");
            }
        }

        if (invitation.getType() == InterviewType.PHYSICAL) {
            if (isBlank(invitation.getLocation())) {
                result.addError("Location is required for physical interview.");
            }
        }

        return result;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean isValidHttpUrl(String url) {
        try {
            URL u = new URL(url);
            String protocol = u.getProtocol();
            return "http".equalsIgnoreCase(protocol) || "https".equalsIgnoreCase(protocol);
        } catch (MalformedURLException e) {
            return false;
        }
    }
}