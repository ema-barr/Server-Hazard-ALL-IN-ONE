package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.cards.BonusCard;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class TakeBonusCardResponse implements Response{

    private boolean success;
    private String cardName;
    private BonusCard cardExtract;
    private int numCard;
    private String logString;


    public TakeBonusCardResponse(boolean success, String cardName, BonusCard cardExtract, int numCard){
        this.success = success;
        this.cardName = cardName;
        this.cardExtract = cardExtract;
        this.numCard = numCard;
        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {cardExtract.getNameCard()};

            formatter.applyPattern(messages.getString("TakeBonusCardResponse_success"));
            logString = formatter.format(messageArgs);
        }else {
            logString = messages.getString("TakeBonusCardResponse_failure");
        }
    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_TAKE_BONUS_CARD");
        res.addProperty("cardName", cardName);
        res.addProperty("cardExtract", cardExtract.toString());
        res.addProperty("numCardsBonusDrawn", numCard);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
