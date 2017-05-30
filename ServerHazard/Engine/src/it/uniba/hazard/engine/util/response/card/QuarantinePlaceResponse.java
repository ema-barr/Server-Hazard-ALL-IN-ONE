package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Instances QuarantinePlaceResponse.
 * @author Donato
 */
public class QuarantinePlaceResponse implements Response {

    private boolean success;
    private String cardName;
    private Location location;
    private String logString;

    public QuarantinePlaceResponse(boolean success, String cardName, Location location){
        this.success = success;
        this.cardName = cardName;
        this.location = location;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {location.toString()};
            formatter.applyPattern(messages.getString("QuarantinePlaceResponse_success"));
            logString = formatter.format(messageArgs);
        }else {
            Object[] messageArgs = {location.toString()};
            formatter.applyPattern(messages.getString("QuarantinePlaceResponse_failure"));
            logString = formatter.format(messageArgs);
        }

    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "BONUS_CARD_QUARANTINE_PLACE");
        res.addProperty("cardName", cardName);
        res.addProperty("location", location.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
