package it.uniba.hazard.engine.cards;


/**
 * Decrease the emergency in one place.
 * @author Donato
 */
public class DecreaseEmergencyPlace extends EventCard{

    private String objectID;

    public DecreaseEmergencyPlace(String eventType) {
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
     * @return instance of DecreaseEmergencyPlace
     */
   public DecreaseEmergencyPlaceInstance getInstance(){
       return new DecreaseEmergencyPlaceInstance(eventType);
   }
}
