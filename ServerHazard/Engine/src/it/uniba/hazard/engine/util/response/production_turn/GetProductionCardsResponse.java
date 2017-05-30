package it.uniba.hazard.engine.util.response.production_turn;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.cards.ProductionCard;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Created by maccn on 03/03/2017.
 */

public class GetProductionCardsResponse implements Response {

    private boolean success;
    private List<ProductionCard> productionCards;
    private ProductionGroup productionGroup;
    private String logString;

    public GetProductionCardsResponse (boolean success, ProductionGroup group, List<ProductionCard> cards) {
        this.success = success;
        productionCards = cards;
        productionGroup = group;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {productionGroup.toString(), productionCards.size()};
            formatter.applyPattern(messages.getString("GetProductionCardsResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {productionGroup.toString()};
            formatter.applyPattern(messages.getString("GetProductionCardsResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "PRODUCTION_GROUP_GET_PRODUCTION_CARDS");
        res.addProperty("productionGroup", productionGroup.toString());
        res.addProperty("productionCards", productionCards.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }

}
