package it.uniba.hazard.engine.exception;

public class ResourceNotInPayloadException extends RuntimeException {
    public ResourceNotInPayloadException(String message) {
        super(message);
    }
}
