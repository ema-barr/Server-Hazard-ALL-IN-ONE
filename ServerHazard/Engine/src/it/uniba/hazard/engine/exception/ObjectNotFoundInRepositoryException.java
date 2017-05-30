package it.uniba.hazard.engine.exception;


public class ObjectNotFoundInRepositoryException extends RuntimeException{
    public ObjectNotFoundInRepositoryException(String message){
        super(message);
    }
}
