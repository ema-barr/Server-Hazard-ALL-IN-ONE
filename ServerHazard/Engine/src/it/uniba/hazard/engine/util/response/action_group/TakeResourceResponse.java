package it.uniba.hazard.engine.util.response.action_group;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by emanu on 25/02/2017.
 */
public class TakeResourceResponse implements Response {
    private boolean success;
    private TransportPawn transportPawn;
    private ActionGroup actionGroup;
    private String logString;

    public TakeResourceResponse(boolean success,
                                TransportPawn transportPawn,
                                ActionGroup actionGroup){
        this.success = success;
        this.transportPawn = transportPawn;
        this.actionGroup = actionGroup;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            Object[] messageArgs = {actionGroup.getNameActionGroup(), transportPawn.toString()};
            formatter.applyPattern(messages.getString("TakeResourceResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {actionGroup.getNameActionGroup(), transportPawn.toString()};
            formatter.applyPattern(messages.getString("TakeResourceResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_GROUP_TAKE_RESOURCES");
        res.addProperty("transportPawn", transportPawn.toString());
        res.addProperty("actionGroup", actionGroup.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }

    public boolean success() {
        return success;
    }
}
