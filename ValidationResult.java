

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private boolean isValid;
    private List<String> errorMessages;

    public ValidationResult() {
        this.isValid = true;
        this.errorMessages = new ArrayList<>();
    }

    public void addError(String message) {
        this.isValid = false;
        this.errorMessages.add(message);
    }

    public boolean isValid() { return isValid; }
    public List<String> getErrorMessages() { return errorMessages; }
}