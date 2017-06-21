package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.DecreaseStrongholdPriceResponse;

/**
 * Instances DecreaseStrongholdPrice.
 * @author Donato.
 */
public class DecreaseStrongholdPriceInstance implements EventCardInstance {
    public String eventType;
    private String objectID;

    public DecreaseStrongholdPriceInstance(String eventType) {
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

    /**
     * Decrease the price of the stronghold of the 25%.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of DecreaseStrongholdPrice
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        int currentCost = gameState.getCurrentStrongholdCost();
        int decreasePrice = currentCost * 85 /100;
        gameState.setCurrentStrongholdCost(decreasePrice);
        return new DecreaseStrongholdPriceResponse(true, "DecreaseStrongholdPrice", decreasePrice);
    }

    /**
     * Deletes the effect of the card: DecreaseStrongholdPrice.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        return null;
    }
}
