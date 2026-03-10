import org.junit.Before;
import org.junit.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.Assert.*;

public class InterviewInvitationValidatorTest {

    private InterviewInvitationValidator validator;
    private Clock fixedClock;

    @Before
    public void setUp() {
        // Fixed "now" for predictable tests
        fixedClock = Clock.fixed(Instant.parse("2026-02-23T10:00:00Z"), ZoneId.of("UTC"));
        validator = new InterviewInvitationValidator(fixedClock);
    }

    @Test
    public void shouldPass_whenOnlineInvitationIsValid() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP001",
                "APP001",
                "JOB001",
                InterviewType.ONLINE,
                LocalDateTime.of(2026, 2, 24, 12, 0), // future relative to fixedClock
                null,
                "https://meet.google.com/abc-defg-hij",
                "Please join 10 minutes earlier."
        );

        ValidationResult result = validator.validate(inv);

        assertTrue(result.isValid());
        assertEquals(0, result.getErrors().size());
    }

    @Test
    public void shouldFail_whenOnlineInvitationMissingMeetingLink() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP001",
                "APP001",
                "JOB001",
                InterviewType.ONLINE,
                LocalDateTime.of(2026, 2, 24, 12, 0),
                null,
                "",
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Meeting link is required for online interview."));
    }

    @Test
    public void shouldFail_whenMeetingLinkIsInvalidUrl() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP001",
                "APP001",
                "JOB001",
                InterviewType.ONLINE,
                LocalDateTime.of(2026, 2, 24, 12, 0),
                null,
                "not-a-url",
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Meeting link must be a valid http/https URL."));
    }

    @Test
    public void shouldPass_whenPhysicalInvitationHasLocation() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP002",
                "APP010",
                "JOB777",
                InterviewType.PHYSICAL,
                LocalDateTime.of(2026, 2, 24, 9, 30),
                "Level 12, ABC Tower, Kuala Lumpur",
                null,
                "Bring IC for registration."
        );

        ValidationResult result = validator.validate(inv);

        assertTrue(result.isValid());
    }

    @Test
    public void shouldFail_whenPhysicalInvitationMissingLocation() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP002",
                "APP010",
                "JOB777",
                InterviewType.PHYSICAL,
                LocalDateTime.of(2026, 2, 24, 9, 30),
                "   ",
                null,
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Location is required for physical interview."));
    }

    @Test
    public void shouldFail_whenInterviewDateTimeIsInThePast() {
        // fixedClock is 2026-02-23 10:00 UTC, so 2026-02-22 is past
        InterviewInvitation inv = new InterviewInvitation(
                "EMP001",
                "APP001",
                "JOB001",
                InterviewType.ONLINE,
                LocalDateTime.of(2026, 2, 22, 10, 0),
                null,
                "https://zoom.us/j/123456789",
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Interview date/time cannot be in the past."));
    }

    @Test
    public void shouldFail_whenMandatoryIdsAreMissing() {
        InterviewInvitation inv = new InterviewInvitation(
                "",
                null,
                "   ",
                InterviewType.PHYSICAL,
                LocalDateTime.of(2026, 2, 24, 9, 30),
                "Somewhere",
                null,
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Employer ID is required."));
        assertTrue(result.getErrors().contains("Applicant ID is required."));
        assertTrue(result.getErrors().contains("Job ID is required."));
    }

    @Test
    public void shouldFail_whenTypeIsNull() {
        InterviewInvitation inv = new InterviewInvitation(
                "EMP001",
                "APP001",
                "JOB001",
                null,
                LocalDateTime.of(2026, 2, 24, 12, 0),
                null,
                null,
                null
        );

        ValidationResult result = validator.validate(inv);

        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Interview type is required."));
    }
}