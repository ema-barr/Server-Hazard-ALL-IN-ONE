package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class RemoveTransportPawnResponse implements Response{

    private boolean success;
    private TransportPawn tp;
    private Location location;
    private String logString;

    public RemoveTransportPawnResponse(boolean success, TransportPawn tp, Location location){
        this.success = success;
        this.tp = tp;
        this.location = location;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            Object[] messageArgs = {tp.toString(), location.toString()};
            formatter.applyPattern(messages.getString("RemoveTransportPawnResponse1_success"));
            logString = formatter.format(messageArgs);
        }else{
            Object[] messageArgs = {tp.toString(), location.toString()};
            formatter.applyPattern(messages.getString("RemoveTransportPawnResponse1_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_QUARANTINE_PLACE");
        res.addProperty("TransportPawn", tp.toString());
        res.addProperty("location", location.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
