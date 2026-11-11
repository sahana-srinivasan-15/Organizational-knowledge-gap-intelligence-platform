package com.orgkgi.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class MlServiceUnavailableException extends RuntimeException {
    public MlServiceUnavailableException(String message) {
        super(message);
    }

    public MlServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
