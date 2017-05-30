package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class CurePlaceResponse implements Response {

    public boolean success;
    private String cardName;
    public Location location;
    public String logString;

    public CurePlaceResponse(boolean success, String cardName, Location location){
        this.success = success;
        this.cardName = cardName;

        this.location = location;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {location.toString()};
            formatter.applyPattern(messages.getString("CurePlaceResponse_success"));
            logString = formatter.format(messageArgs);
        }else {
            Object[] messageArgs = {location.toString()};
            formatter.applyPattern(messages.getString("CurePlaceResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "BONUS_CARD_CURE_PLACE");
        res.addProperty("cardName", cardName);
        res.addProperty("location", location.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
