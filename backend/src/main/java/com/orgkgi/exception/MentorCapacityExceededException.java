package com.orgkgi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class MentorCapacityExceededException extends RuntimeException {
    public MentorCapacityExceededException(String message) {
        super(message);
    }
}
