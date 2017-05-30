package it.uniba.hazard.engine.util.response.emergency_turn;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Created by maccn on 03/03/2017.
 */
public class EmergencyTurnExecuteTurnResponse implements Response {

    private boolean success;
    private Emergency emergency;
    private List<Location> locations;
    private String logString;

    public EmergencyTurnExecuteTurnResponse (boolean success, Emergency e, List locations) {
        this.success = success;
        emergency = e;
        this.locations = locations;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {

            StringBuilder logTemp = new StringBuilder();
            for (Location l : this.locations) {
                logTemp.append(", " + l.toString());
            }
            int c = logTemp.lastIndexOf(",");
            logTemp.setCharAt(c, ' ');

            Object[] messageArgs = {emergency.getNameEmergency(), logTemp.toString()};
            formatter.applyPattern(messages.getString("EmergencyTurnExecuteTurnResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {emergency.getNameEmergency()};
            formatter.applyPattern(messages.getString("EmergencyTurnExecuteTurnResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EMERGENCY_TURN_START");
        res.addProperty("emergency", emergency.toString());
        JsonArray diffusedLocationsJson = new JsonArray();
        for (Location l : locations) {
            diffusedLocationsJson.add(l.toJson());
        }
        res.add("diffusedLocations", diffusedLocationsJson);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
