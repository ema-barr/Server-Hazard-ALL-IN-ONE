package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.MalusProductionCardResponse;

/**
 * Instances MalusProductionCard.
 * @author Donato
 */
public class MalusProductionCardInstance implements EventCardInstance{
    public String eventType;
    private String objectID;
    private int numberProductionCards;

    public MalusProductionCardInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID(){
        return objectID;
    }

    /**
     * Decrease the number of the production cards to choose of one unit.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of MalusProductionCard
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        numberProductionCards = gameState.getNumberOfProductionCards();
        //diminuisce di uno il numero di carte produzione
        gameState.setNumberOfProductionCards(numberProductionCards - 1);
        return new MalusProductionCardResponse(true, "MalusProductionCard", numberProductionCards-1);
    }

    /**
     * Deletes the effect of the card: MalusProductionCard.
     * @param gameState State of the game
     * @return null
     */
    public Response revertAction(GameState gameState){
        gameState.setNumberOfProductionCards(gameState.getDefaultNumOfProductionCards());
        return null;
    }
}
