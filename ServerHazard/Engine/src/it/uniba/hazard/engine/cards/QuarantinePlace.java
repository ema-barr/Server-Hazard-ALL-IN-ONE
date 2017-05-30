package it.uniba.hazard.engine.cards;


/**
 * Quarantine in one place.
 * @author Donato
 */
public class QuarantinePlace extends BonusCard{

    private String objectID;




    public QuarantinePlace(String bonusType,String name, String description) {
        super(bonusType,name,description);
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
     * @return instance of QuarantinePlace
     */
    public QuarantinePlaceInstance getInstance(){
        return  new QuarantinePlaceInstance(bonusType);
    }

}
