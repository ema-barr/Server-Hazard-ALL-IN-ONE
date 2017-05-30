package it.uniba.hazard.engine.cards;




/**
 * Decrease the number of production Card to choose.
 * @author Donato
 */
public class MalusProductionCard extends EventCard{

    private String objectID;


    public MalusProductionCard(String eventType) {
        super(eventType);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID(){
        return objectID;
    }

    /**
     *
     * @return instance of MalusProductionCard
     */
    public MalusProductionCardInstance getInstance(){
        return new MalusProductionCardInstance(eventType);
    }


}
