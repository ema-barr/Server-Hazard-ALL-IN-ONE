package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 09/03/2017.
 */
public class QuarantinePlaceRevertResponse implements Response {

    private boolean success;
    private String cardName;
    private Emergency emergency;
    private Location location;
    private String logString;

    public QuarantinePlaceRevertResponse(boolean success, String cardName, Emergency emergency, Location location){
        this.success = success;
        this.cardName = cardName;
        this.emergency = emergency;
        this.location = location;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {location.toString(), emergency.getNameEmergency()};
            formatter.applyPattern(messages.getString("QuarantinePlaceRevertResponse_success"));
            logString = formatter.format(messageArgs);
        }else {
            Object[] messageArgs = {location.toString(), emergency.getNameEmergency()};
            formatter.applyPattern(messages.getString("QuarantinePlaceRevertResponse_failure"));
            logString = formatter.format(messageArgs);
        }

    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "BONUS_CARD_QUARANTINE_PLACE_REVERT");
        res.addProperty("cardName", cardName);
        res.addProperty("emergency", emergency.toString());
        res.addProperty("location", location.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}

