package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.MovePlaceResponse;


/**
 * Allows to move one pawn from one location to another.
 * @author Donato
 */
public class MovePlace extends BonusCard{

    private String objectID;
    private Location destination;


    public MovePlace(String bonusType, Location destination, String name, String description) {
        super(bonusType,name,description);
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
        this.destination = destination;
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
     * @return instance of MovePlace
     */
    public MovePlaceInstance getInstance(){
        return new MovePlaceInstance(bonusType,destination);
    }

}
