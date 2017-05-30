package it.uniba.hazard.engine.cards;


/**
 * Remove the transport pawn from one place.
 */
public class RemoveTransportPawn extends EventCard{

    private String objectID;


    public RemoveTransportPawn(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID.
     */
    public String getObjectID() {
        return objectID;
    }


    /**
     *
     * @return instance of RemoveTransportPawn
     */
    public RemoveTransportPawnInstance getInstance(){
        return new RemoveTransportPawnInstance(eventType);
    }


}
