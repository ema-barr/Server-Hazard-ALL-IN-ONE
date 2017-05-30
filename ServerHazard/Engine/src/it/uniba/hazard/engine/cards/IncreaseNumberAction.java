package it.uniba.hazard.engine.cards;



/**
 * Increase the number of the Action available.
 * @author Donato
 */
public class IncreaseNumberAction extends BonusCard{

    private String objectID;


    public IncreaseNumberAction(String bonusType, String name, String description) {
        super(bonusType,name,description);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of the objectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     *
     * @return instance of IncreaseNumberAction
     */
    public IncreaseNumberActionInstance getInstance(){
        return new IncreaseNumberActionInstance(bonusType);
    }

}
