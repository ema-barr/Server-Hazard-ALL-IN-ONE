package it.uniba.hazard.engine.util.response.production_group;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by emanu on 25/02/2017.
 */
public class RemoveTransportPawnResponse implements Response{
    private boolean success;
    private TransportPawn transportPawn;
    private ProductionGroup productionGroup;
    private String logString;

    public RemoveTransportPawnResponse(boolean success,
                               TransportPawn transportPawn){
        this.success = success;
        this.transportPawn = transportPawn;
        this.productionGroup = transportPawn.getProductionGroup();

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            Object[] messageArgs = {transportPawn.toString(), productionGroup.toString()};
            formatter.applyPattern(messages.getString("RemoveTransportPawnResponse2_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {transportPawn.toString(), productionGroup.toString()};
            formatter.applyPattern(messages.getString("RemoveTransportPawnResponse2_failure"));
            logString = formatter.format(messageArgs);
        }

    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "PRODUCTION_GROUP_REMOVE_TRANSPORT_PAWN");
        res.addProperty("transportPawn", transportPawn.toString());
        res.addProperty("productionGroup", productionGroup.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}
