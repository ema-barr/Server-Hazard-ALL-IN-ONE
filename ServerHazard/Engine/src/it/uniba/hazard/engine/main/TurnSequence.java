package it.uniba.hazard.engine.main;

import java.util.List;

public class TurnSequence {
    private List<Turn> turnOrder;
    private int currentTurnIndex;

    public TurnSequence(List<Turn> turnOrder) {
        this.turnOrder = turnOrder;
        //The current turn is set to -1, this means that the game has not started yet.
        currentTurnIndex = -1;
    }

    void setNextTurn() {
        if (currentTurnIndex == -1) {
            currentTurnIndex = 1;
        } else if (currentTurnIndex == turnOrder.size()) {
            currentTurnIndex = 1;
        } else {
            currentTurnIndex++;
        }
    }

    public List<Turn> getTurnOrder() {
        return turnOrder;
    }

    public Turn getCurrentTurn() {
        return turnOrder.get(currentTurnIndex - 1);
    }
}
