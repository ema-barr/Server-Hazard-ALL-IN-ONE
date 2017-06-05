package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by MANU on 08/03/2017.
 */
public class RemoveTransportPawnNoPawnsResponse implements Response {
    private boolean success;
    private String cardName;
    private String logString;

    public RemoveTransportPawnNoPawnsResponse(boolean success, String cardName){
        this.success = success;
        this.cardName = cardName;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            logString = messages.getString("DefaultCardResponse_success");
        } else {
            logString = messages.getString("DefaultCardResponse_failure");
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_REMOVE_TRANSPORT_PAWN_NO_PAWNS");
        res.addProperty("cardName", cardName);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
