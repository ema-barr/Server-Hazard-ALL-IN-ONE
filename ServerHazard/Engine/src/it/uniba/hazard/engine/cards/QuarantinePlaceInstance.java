package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.QuarantinePlaceResponse;

/**
 * Instances QuarantinePlace.
 * @author Donato
 */
public class QuarantinePlaceInstance implements BonusCardInstance {
    public String bonusType;
    private String objectID;
    private Location quarantineLocation;



    public QuarantinePlaceInstance(String bonusType) {
        this.bonusType = bonusType;
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
     * The location of action pawn has put in quarantine.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of QuarantinePlace
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        ActionTurn at = (ActionTurn) turn;
        ActionPawn ap = at.getPlayer().getActionPawn();
        quarantineLocation = gameState.getLocationInMap(ap);
        quarantineLocation.setQuarantined(true);
        return new QuarantinePlaceResponse(true,"QuarantinePlace",quarantineLocation);

    }

    /**
     * Deletes the effects of Quarantine in 'quarantineLocation'.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        quarantineLocation.setQuarantined(false);
        return null;
    }
}
