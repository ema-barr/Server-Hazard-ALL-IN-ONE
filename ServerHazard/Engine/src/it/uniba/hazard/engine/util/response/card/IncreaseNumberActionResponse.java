package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by MANU on 08/03/2017.
 */
public class IncreaseNumberActionResponse implements Response{
    private boolean success;
    private String cardName;
    private ActionGroup player;
    private int newNumberActions;
    private String logString;

    public IncreaseNumberActionResponse(boolean success, String cardName, ActionGroup player, int newNumberActions){
        this.success = success;
        this.cardName = cardName;
        this.player = player;
        this.newNumberActions = newNumberActions;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {player.toString(), newNumberActions};
            formatter.applyPattern(messages.getString("IncreaseNumberActionResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {player.toString()};
            formatter.applyPattern(messages.getString("IncreaseNumberActionResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "BONUS_CARD_INCREASE_NUMBER_ACTIONS");
        res.addProperty("cardName", cardName);
        res.addProperty("actionGroup", player.toString());
        res.addProperty("newNumberActions", newNumberActions);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
