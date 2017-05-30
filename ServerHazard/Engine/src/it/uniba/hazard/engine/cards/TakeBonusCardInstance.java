package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.main.TurnSequence;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.TakeBonusCardResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Instances TakeBonusCard.
 * @author Donato
 */
public class TakeBonusCardInstance implements EventCardInstance {
    public String eventType;
    private String objectID;


    public TakeBonusCardInstance(String eventType) {
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
     * Take one Bonus Card random.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        List<BonusCard> bs = gameState.getBonusCards(1);

        //Add bonus card to all actionTurn
        TurnSequence turnSequence = (TurnSequence) Repository.getFromRepository("turn_order");
        ArrayList<Turn> turns = (ArrayList<Turn>) turnSequence.getTurnOrder();
        for (Turn t: turns){
            if (t.getClass() == ActionTurn.class){
                ActionTurn actionTurn = (ActionTurn) t;
                for (BonusCard b: bs){
                    actionTurn.addBonusCard(gameState, b);
                }
            }
        }
        return new TakeBonusCardResponse(true, "TakeBonusCard",bs.get(0),1);
    }

    /**
     * Deletes the effect of the card: TakeBonusCard.
     * @param gameState State of the game
     * @return null
     */
    public Response revertAction(GameState gameState){
        return null;
    }
}
