package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Created by isz_d on 31/03/2017.
 */
public interface CardInstance {
    Response executeAction(GameState gameState, Turn turn);
    Response revertAction(GameState gameState);
    String getObjectID();
}

