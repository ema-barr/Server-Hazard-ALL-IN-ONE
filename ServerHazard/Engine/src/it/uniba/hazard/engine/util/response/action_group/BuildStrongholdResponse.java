package it.uniba.hazard.engine.util.response.action_group;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.exception.InsufficientResourcesException;
import it.uniba.hazard.engine.exception.StrongholdAlreadyPresentException;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by emanu on 25/02/2017.
 */
public class BuildStrongholdResponse implements Response {
    private static final String INSUFFICIENT_FUNDS_STRING = "Non si dispone delle risorse necessarie per costruire il presidio.";
    private static final String STRONGHOLD_ALREADY_PRESENT_STRING = "C'è già un presidio per %s in quest'area.";

    private boolean success;
    private Emergency emergency;
    private Location location;
    private String logString;
    private ActionGroup actionGroup;

    public BuildStrongholdResponse(boolean success,
                                   ActionGroup actionGroup,
                                   Emergency emergency,
                                   Location location){
        this.success = success;
        this.emergency = emergency;
        this.location = location;
        this.actionGroup = actionGroup;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            Object[] messageArgs = {location.toString(), emergency.toString(), actionGroup.getNameActionGroup()};
            formatter.applyPattern(messages.getString("BuildStrongholdResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {emergency.toString(), location.toString()};
            formatter.applyPattern(messages.getString("BuildStrongholdResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }
    public BuildStrongholdResponse(boolean success,
                                   ActionGroup actionGroup,
                                   Emergency emergency,
                                   Location location,
                                   StrongholdAlreadyPresentException e){
        this(success, actionGroup, emergency, location);
        logString = String.format(STRONGHOLD_ALREADY_PRESENT_STRING, emergency.getNameEmergency());
    }

    public BuildStrongholdResponse(boolean success,
                                   ActionGroup actionGroup,
                                   Emergency emergency,
                                   Location location,
                                   InsufficientResourcesException e){
        this(success, actionGroup, emergency, location);
        logString = INSUFFICIENT_FUNDS_STRING;
    }



    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_GROUP_BUILD_STRONGHOLD");
        res.addProperty("emergency", emergency.toString());
        res.addProperty("location", location.toString());
        res.addProperty("actionGroup", actionGroup.getNameActionGroup());
        res.addProperty("logString", logString);
        return res.toString();
    }

    public boolean success() {
        return success;
    }
}
