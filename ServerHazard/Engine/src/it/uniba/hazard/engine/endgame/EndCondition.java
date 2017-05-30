package it.uniba.hazard.engine.endgame;

import it.uniba.hazard.engine.main.GameState;

/**
 * Created by isz_d on 09/01/2017.
 */
public interface EndCondition {
    public boolean evaluateEndCondition(GameState state);
}
