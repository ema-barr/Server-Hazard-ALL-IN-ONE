package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class BonusProductionCardResponse implements Response {

    private boolean success;
    private String cardName;
    private int numberProductionCards;
    private String logString;

    public BonusProductionCardResponse(boolean success, String cardName, int numberProductionCards) {
        this.success = success;
        this.cardName = cardName;
        this.numberProductionCards = numberProductionCards;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {numberProductionCards};
            formatter.applyPattern(messages.getString("BonusProductionCardResponse_success"));
            logString = formatter.format(messageArgs);

        }else{
            logString = messages.getString("BonusProductionCardResponse_failure");
        }
    }
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_BONUS_PRODUCTION_CARD");
        res.addProperty("cardName", cardName);
        res.addProperty("numberProductionCards", numberProductionCards);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
