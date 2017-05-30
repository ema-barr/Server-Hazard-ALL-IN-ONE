package it.uniba.hazard.engine.cards;


/**
 * Take Bonus Card.
 * @author Donato
 */
public class TakeBonusCard extends EventCard{

    private String objectID;


    public TakeBonusCard(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     *
     * @return instance of TakeBonusCard
     */
    public TakeBonusCardInstance getInstance(){
        return new TakeBonusCardInstance(eventType);
    }

}
