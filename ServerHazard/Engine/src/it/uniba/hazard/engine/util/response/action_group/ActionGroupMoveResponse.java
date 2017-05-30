package it.uniba.hazard.engine.util.response.action_group;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.io.File;
import java.text.MessageFormat;
import java.util.Locale;
import java.util.ResourceBundle;

/**
 * Created by isz_d on 25/02/2017.
 */
public class ActionGroupMoveResponse implements Response {
    private boolean success;
    private Location newLocation;
    private ActionGroup actionGroup;
    private String logString;

    public ActionGroupMoveResponse(
            boolean success, Location newLocation, ActionGroup actionGroup) {
        this.success = success;
        this.newLocation = newLocation;
        this.actionGroup = actionGroup;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            Object[] messageArgs = {actionGroup.getNameActionGroup(), newLocation.toString()};

            formatter.applyPattern(messages.getString("ActionGroupMoveResponse_success"));
            logString = formatter.format(messageArgs);

        } else {
            Object[] messageArgs = {actionGroup.getNameActionGroup(), newLocation.toString()};
            formatter.applyPattern(messages.getString("ActionGroupMoveResponse_failure"));
            logString = formatter.format(messageArgs);
        }

    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_GROUP_MOVE");
        res.addProperty("newLocation", newLocation.toString());
        res.addProperty("actionGroup", actionGroup.getNameActionGroup());
        res.addProperty("logString", logString);
        return res.toString();
    }

    public boolean success() {
        return success;
    }
}
