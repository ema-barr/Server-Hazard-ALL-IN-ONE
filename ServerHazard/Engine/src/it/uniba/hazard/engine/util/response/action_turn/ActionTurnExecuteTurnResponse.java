package it.uniba.hazard.engine.util.response.action_turn;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import javax.swing.*;
import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by maccn on 03/03/2017.
 */
public class ActionTurnExecuteTurnResponse implements Response {

    private boolean success;
    private ActionGroup actionGroup;
    private String logString;

    public ActionTurnExecuteTurnResponse (boolean success, ActionGroup group) {
        this.success = success;
        actionGroup = group;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {actionGroup.getNameActionGroup()};
            formatter.applyPattern(messages.getString("ActionTurnExecuteTurnResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {actionGroup.getNameActionGroup()};
            formatter.applyPattern(messages.getString("ActionTurnExecuteTurnResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_TURN_START");
        res.addProperty("actionGroup", actionGroup.getNameActionGroup());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
