package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.BonusProductionCardResponse;

/**
 * Instance BonusProductionCard.
 * @author Donato
 */
public class BonusProductionCardInstance implements EventCardInstance{

    private String objectID;
    private int numberProductionCards;
    public String eventType;

    public BonusProductionCardInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }


    /**
     * Increases the number of production cards of one unit.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of BonusProductionCard
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        numberProductionCards = gameState.getNumberOfProductionCards();

        //aumenta di uno il numero di carte produzione
        gameState.setNumberOfProductionCards(numberProductionCards + 1);
        return new BonusProductionCardResponse(true, "BonusProductionCard", numberProductionCards+1);
    }

    /**
     * Deletes the effects of the card: BonusProductionCard.
     * @param gameState State of the game
     * @return null
     */
    public Response revertAction(GameState gameState) {
        gameState.setNumberOfProductionCards(numberProductionCards);
        return null;
    }

    /**
     *
     * @return identification of the objectID
     */
    public String getObjectID(){
        return objectID;
    }

}
