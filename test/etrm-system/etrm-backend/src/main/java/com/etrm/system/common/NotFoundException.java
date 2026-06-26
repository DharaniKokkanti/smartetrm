package com.etrm.system.common;

/** Thrown when a requested record doesn't exist — maps to HTTP 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}

