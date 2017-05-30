package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.MovePlaceResponse;

/**
 * Instances MovePlace.
 * @author Donato
 */
public class MovePlaceInstance implements BonusCardInstance{
    public String bonusType;
    private String objectID;
    private Location destination;


    public MovePlaceInstance(String bonusType, Location destination) {
        this.bonusType = bonusType;
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
     * Move the pawn to 'destination'.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        ActionTurn at = (ActionTurn) turn;

        at.getPlayer().moveActionPawn(gameState,destination);

        return new MovePlaceResponse(true,at.getPlayer(),destination);
    }

    /**
     * Deletes the effect of the card: MovePlace.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        return null;
    }
}
