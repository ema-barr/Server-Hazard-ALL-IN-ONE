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
public class IncreaseEmergencyPlaceResponse implements Response{

    public boolean success;
    public Emergency emergency;
    public Location location;
    public int levelEmergency;
    public String logString;
    public String cardName;

    public IncreaseEmergencyPlaceResponse(boolean success, String cardName, Emergency emergency, Location location, int levelEmergency){
        this.success = success;
        this.cardName = cardName;
        this.emergency = emergency;
        this.location = location;
        this.levelEmergency = levelEmergency;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {emergency.getNameEmergency(), levelEmergency, location.toString()};
            formatter.applyPattern(messages.getString("IncreaseEmergencyPlaceResponse_success"));
            logString = formatter.format(messageArgs);

        }else {
            Object[] messageArgs = {emergency.getNameEmergency(), location.toString()};
            formatter.applyPattern(messages.getString("IncreaseEmergencyPlaceResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_INCREASE_EMERGENCY_LEVEL");
        res.addProperty("cardName", cardName);
        res.addProperty("emergency", emergency.toString());
        res.addProperty("location", location.toString());
        res.addProperty("levelEmergency", levelEmergency);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
