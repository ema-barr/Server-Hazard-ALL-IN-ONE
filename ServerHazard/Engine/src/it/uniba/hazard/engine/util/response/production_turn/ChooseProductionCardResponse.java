package it.uniba.hazard.engine.util.response.production_turn;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by maccn on 06/03/2017.
 */

public class ChooseProductionCardResponse implements Response {

    private boolean success;
    private ProductionGroup productionGroup;
    private String logString;

    public ChooseProductionCardResponse (boolean success, ProductionGroup group) {
        this.success = success;
        productionGroup = group;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {productionGroup.toString()};
            formatter.applyPattern(messages.getString("ChooseProductionCardResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {productionGroup.toString()};
            formatter.applyPattern(messages.getString("ChooseProductionCardResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "PRODUCTION_TURN_CHOOSE_PRODUCTION_CARD");
        res.addProperty("productionGroup", productionGroup.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }
}

