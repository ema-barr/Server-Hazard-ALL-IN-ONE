package it.uniba.hazard.engine.util;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import it.uniba.hazard.engine.cards.BonusCard;
import it.uniba.hazard.engine.cards.Card;

import java.lang.reflect.Type;

/**
 * Created by isz_d on 28/02/2017.
 */
public class CardSerializer implements JsonSerializer<Card> {
    @Override
    public JsonElement serialize(Card card, Type type, JsonSerializationContext jsonSerializationContext) {
        JsonObject result = new JsonObject();
        result.addProperty("name", card.getObjectID());
        return result;
    }

}
