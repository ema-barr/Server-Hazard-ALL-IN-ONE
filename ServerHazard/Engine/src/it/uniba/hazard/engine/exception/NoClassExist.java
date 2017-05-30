package it.uniba.hazard.engine.exception;

/**
 * Created by denny on 21/02/2017.
 */
public class NoClassExist extends RuntimeException {
    public NoClassExist(String message) {
        super(message);
    }
}
