package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Interface Card.
 * @author Donato
 */
public interface Card {
    @Deprecated
    Response executeAction(GameState gameState, Turn turn); // DEPRECATED
    @Deprecated
    Response revertAction(GameState gameState); // DEPRECATED
    String getObjectID();

}
