package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class BonusProductionCardRevertResponse implements Response {

    private boolean success;
    private int numberProductionCards;
    private String logString;

    public BonusProductionCardRevertResponse(boolean success,int numberProductionCards){
        this.success = success;
        this.numberProductionCards = numberProductionCards;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {numberProductionCards};
            formatter.applyPattern(messages.getString("BonusProductionCardRevertResponse_success"));
            logString = formatter.format(messageArgs);

        }else{
            logString = messages.getString("BonusProductionCardRevertResponse_failure");
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_BONUS_PRODUCTION_CARD_REVERT");
        res.addProperty("numberProductionCards", numberProductionCards);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
