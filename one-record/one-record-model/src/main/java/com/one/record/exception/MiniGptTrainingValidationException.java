package com.one.record.exception;

public class MiniGptTrainingValidationException extends RuntimeException {

    public MiniGptTrainingValidationException(String message) {
        super(message);
    }

    public MiniGptTrainingValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
