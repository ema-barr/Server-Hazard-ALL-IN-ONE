package it.uniba.hazard.engine.cards;

/**
 * Default Card. It Haven't action.
 * @author Donato
 */
public class DefaultCard extends EventCard {

    private String objectID;

    public DefaultCard(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     * @return identification of objectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     *
     * @return instance of DefaultCard
     */
    public DefaultCardInstance getInstance(){
        return new DefaultCardInstance(eventType);
    }
}


