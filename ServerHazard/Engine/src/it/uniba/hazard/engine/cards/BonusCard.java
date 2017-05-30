package it.uniba.hazard.engine.cards;

import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.BonusCardSerializer;
import it.uniba.hazard.engine.util.CardSerializer;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Superclass of BonusCard
 * @author Donato
 */
public abstract class BonusCard implements Card {

    public String bonusType;
    public String name;
    public String description;

    public BonusCard(String bonusType, String name, String description) {

        this.bonusType = bonusType;
        this.name = name;
        this.description = description;

    }

    /**
     * Returns the name of the bonus card.
     * @return name of the bonus card
     */
    public String getBonusType() {
        return this.bonusType;
    }

    public String getNameCard(){
        return this.name;
    }

    public String getDescription(){
        return this.description;
    }


    /**
     * performs the effect of the card.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the Response of the card
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
     * @return identification of the objectID
     */
    @Override
    public String getObjectID() {
        return null;
    }



    /**
     * Build the json object.
     * @return the json.
     */
    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(BonusCard.class, new BonusCardSerializer());
        return gb.create().toJsonTree(this);
    }

    /**
     * Returns a new instantiation of the card
     * @return
     */
    public abstract BonusCardInstance getInstance();

}
