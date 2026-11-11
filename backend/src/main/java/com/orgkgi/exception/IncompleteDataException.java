package com.orgkgi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class IncompleteDataException extends RuntimeException {

    private final List<String> missingFields;

    public IncompleteDataException(String message, List<String> missingFields) {
        super(message + " Missing required data: " + String.join(", ", missingFields));
        this.missingFields = missingFields;
    }

    public List<String> getMissingFields() {
        return missingFields;
    }
}
