package it.uniba.hazard.engine.cards;


/**
 * Bonus Card on the production.
 * @author Donato
 */
public class BonusProductionCard extends EventCard{

    private String objectID;

    public BonusProductionCard(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of the objectID
     */
    public String getObjectID(){
        return objectID;
    }

    /**
     *
     * @return instance of BonusProductionCard
     */
    public BonusProductionCardInstance getInstance(){
        return new BonusProductionCardInstance(eventType);
    }


}
