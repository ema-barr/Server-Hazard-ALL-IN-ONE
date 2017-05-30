package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.cards.MovePlace;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 04/03/2017.
 */
public class MovePlaceResponse implements Response {

    private boolean success;
    private ActionGroup actionGroup;
    private Location location;
    private String logString;

    public MovePlaceResponse(boolean success, ActionGroup actionGroup, Location location){
        this.success = success;
        this.actionGroup = actionGroup;
        this.location = location;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {actionGroup.getNameActionGroup(), location.toString()};
            formatter.applyPattern(messages.getString("MovePlaceResponse_success"));
            logString = formatter.format(messageArgs);
        }else {
            Object[] messageArgs = {actionGroup.getNameActionGroup(), location.toString()};
            formatter.applyPattern(messages.getString("MovePlaceResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "BONUS_CARD_MOVE_PLACE");
        res.addProperty("actionGroup", actionGroup.getNameActionGroup());
        res.addProperty("location", location.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
