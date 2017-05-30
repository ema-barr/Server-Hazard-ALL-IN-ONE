package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.DefaultCardResponse;

/**
 * Instances DefaultCard.
 * @author Donato
 */
public class DefaultCardInstance implements EventCardInstance{
    private String eventType;
    private String objectID;

    public DefaultCardInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID() {
        return objectID;
    }

    @Override
    public DefaultCardResponse executeAction(GameState gameState, Turn turn) {
        return new DefaultCardResponse(true, "DefaultCard");
    }

    /**
     * Deletes the effect of the card: DefaultCard.
     * @param gameState State of the game
     * @return null
     */
    public Response revertAction(GameState gameState){
        return null;
    }
}
