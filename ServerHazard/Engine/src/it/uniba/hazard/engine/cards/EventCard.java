package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Superclass of the EventCard.
 * @author Donato
 */
public abstract class EventCard implements Card {

    public String eventType;


    public EventCard(String eventType) {
        this.eventType = eventType;
    }

    /**
     * Performs the effects of the card.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the Response of the Card
     */
    @Override
    @Deprecated
    public Response executeAction(GameState gameState, Turn turn) {
        return null;
    }

    /**
     * Deletes the effects of the card.
     * @param gameState State of the game
     * @return null
     */
    @Override
    @Deprecated
    public Response revertAction(GameState gameState) {
        return null;
    }

    /**
     *
     * @return null
     */
    @Override
    public String getObjectID() {
        return null;
    }

    /**
     * Returns a new instantiation of the card
     * @return
     */
    public abstract EventCardInstance getInstance();
}
