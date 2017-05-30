package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class IncreaseContagionLevelResponse implements Response {

    private boolean success;
    private String cardName;
    private Emergency emergency;
    private String logString;
    private int level;

    public IncreaseContagionLevelResponse(boolean success, String cardName, Emergency emergency, int level){
        this.success = success;
        this.cardName = cardName;
        this.emergency = emergency;
        this.level = level;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {emergency.getNameEmergency(), level};
            formatter.applyPattern(messages.getString("IncreaseContagionLevelResponse_success"));
            logString = formatter.format(messageArgs);
        }else{
            Object[] messageArgs = {emergency.getNameEmergency()};
            formatter.applyPattern(messages.getString("IncreaseContagionLevelResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }




    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_INCREASE_CONTAGION_LEVEL");
        res.addProperty("cardName", cardName);
        res.addProperty("emergency", emergency.toString());
        res.addProperty("newLevel", level);

        res.addProperty("logString", logString);
        return res.toString();
    }
}
