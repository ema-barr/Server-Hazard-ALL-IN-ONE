package it.uniba.hazard.engine.cards;


/**
 * Increase the emergency in one place.
 * @author Donato
 */
public class IncreaseEmergencyPlace extends EventCard{

    private String objectID;



    public IncreaseEmergencyPlace(String eventType) {
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
     * @return instance of IncreaseEmergencyPlace
     */
   public IncreaseEmergencyPlaceInstance getInstance(){
       return new IncreaseEmergencyPlaceInstance(eventType);
   }
}
