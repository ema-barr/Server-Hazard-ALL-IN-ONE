package it.uniba.hazard.engine.cards;


/**
 * Decrease the price of the Stronghold.
 * @author Donato
 */
public class DecreaseStrongholdPrice extends EventCard{

    private String objectID;

    public DecreaseStrongholdPrice(String eventType) {
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
     * @return instance of DecreaseStrongholdPrice
     */
    public DecreaseStrongholdPriceInstance getInstance(){
        return new DecreaseStrongholdPriceInstance(eventType);
    }

}
