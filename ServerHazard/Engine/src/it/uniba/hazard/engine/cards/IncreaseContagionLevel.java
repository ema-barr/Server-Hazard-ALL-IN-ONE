package it.uniba.hazard.engine.cards;


/**
 * Increase the level of the infection.
 * @author Donato
 */
public class IncreaseContagionLevel extends EventCard{

    private String objectID;


    public IncreaseContagionLevel(String eventType) {
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
     * @return instance of IncreaseContagionLevel
     */
    public IncreaseContagionLevelInstance getInstance(){
        return new IncreaseContagionLevelInstance(eventType);
    }


}
