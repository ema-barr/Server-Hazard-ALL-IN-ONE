package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.CurePlaceResponse;

import java.util.Set;

/**
 * Instances CurePlace.
 */
public class CurePlaceInstance implements BonusCardInstance {

    private String objectID;
    public String bonusType;

    public CurePlaceInstance(String bonusType) {
        this.bonusType = bonusType;
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
     * Cures the place where the current action group resides.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of CurePlace
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        ActionTurn at = (ActionTurn) turn;
        ActionPawn ap = at.getPlayer().getActionPawn();
        Location l = gameState.getLocationInMap(ap);
        Set<Emergency> locEmergency = l.getEmergencies();
        for (Emergency e : locEmergency) {
            l.setEmergencyLevel(e, 0);
        }
        return new CurePlaceResponse(true,"CurePlace",l);
    }

    /**
     * Deletes the effect of the card: CurePlace.
     * @param gameState State of the game
     * @return null;
     */
    public Response revertAction(GameState gameState){
        return null;
    }
}
