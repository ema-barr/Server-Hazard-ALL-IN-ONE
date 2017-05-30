package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class DecreaseStrongholdPriceResponse implements Response {

    private boolean success;
    private String logString;
    private int decreasePrice;
    private String cardName;

    public DecreaseStrongholdPriceResponse(boolean success, String cardName, int decreasePrice){
        this.success = success;
        this.decreasePrice = decreasePrice;
        this.cardName = cardName;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {decreasePrice};
            formatter.applyPattern(messages.getString("DecreaseStrongholdPriceResponse_success"));
            logString = formatter.format(messageArgs);
        }else{
            logString = messages.getString("DecreaseStrongholdPriceResponse_failure");
        }
    }
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_DECREASE_STRONGHOLD_PRICE");
        res.addProperty("cardName", cardName);
        res.addProperty("strongholdPrice" , decreasePrice);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
