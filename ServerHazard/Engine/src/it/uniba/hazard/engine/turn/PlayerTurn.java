package it.uniba.hazard.engine.turn;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Created by maccn on 28/12/2016.
 */
public interface PlayerTurn extends Turn {

    public Response runCommand (GameState gameState, String [] param);
}
