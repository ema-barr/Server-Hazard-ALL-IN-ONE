package it.uniba.hazard.engine.util;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import it.uniba.hazard.engine.cards.BonusCard;
import it.uniba.hazard.engine.cards.Card;

import java.lang.reflect.Type;

/**
 * Created by isz_d on 06/04/2017.
 */
public class BonusCardSerializer implements JsonSerializer<BonusCard> {
    @Override
    public JsonElement serialize(BonusCard bonusCard, Type type, JsonSerializationContext jsonSerializationContext) {
        JsonObject result = new JsonObject();
        result.addProperty("objectID", bonusCard.getObjectID());
        result.addProperty("nameClass", bonusCard.getBonusType());
        result.addProperty("nameCard", bonusCard.getNameCard());
        result.addProperty("description", bonusCard.getDescription());
        return result;
    }
}
