package it.uniba.hazard.engine.util.response.action_turn;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.cards.BonusCard;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Created by maccn on 03/03/2017.
 */
public class GetBonusCardsResponse implements Response {

    private boolean success;
    private List<BonusCard> bonusCards;
    private ActionGroup actionGroup;
    private String logString;


    public GetBonusCardsResponse (boolean success, ActionGroup group, List<BonusCard> bonusCards) {
        this.success = success;
        this.bonusCards = bonusCards;
        this.actionGroup = group;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {actionGroup.getNameActionGroup(), bonusCards.size()};
            formatter.applyPattern(messages.getString("GetBonusCardsResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {actionGroup.getNameActionGroup()};
            formatter.applyPattern(messages.getString("GetBonusCardsResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        JsonArray bonusCardsArray = new JsonArray();
        for (BonusCard bonusCard: bonusCards){
            bonusCardsArray.add(bonusCard.getObjectID());
        }
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_TURN_GET_BONUS_CARDS");
        res.addProperty("actionGroup", actionGroup.getNameActionGroup());
        res.add("bonusCards", bonusCardsArray);
        res.addProperty("logString", logString);
        return res.toString();
    }

}
