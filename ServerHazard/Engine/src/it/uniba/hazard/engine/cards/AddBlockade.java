package it.uniba.hazard.engine.cards;

/**
 * Set the Blockade between location.
 * @author Donato
 */
public class AddBlockade extends EventCard{

    private String objectID;

    public AddBlockade(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of the ObjectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     *
     * @return instance of AddBlockade
     */
    public AddBlockadeInstance getInstance(){
        return new AddBlockadeInstance(eventType);
    }

}
