package it.uniba.hazard.engine.util.response.production_turn;

import com.google.gson.JsonArray;
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
public class ProductionTurnExecuteTurnResponse implements Response {

    private boolean success;
    private ProductionGroup productionGroup;
    private String logString;
    List<ProductionCard> productionCards;

    public ProductionTurnExecuteTurnResponse (boolean success, ProductionGroup group, List<ProductionCard> productionCards) {
        this.success = success;
        productionGroup = group;
        this.productionCards = productionCards;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {productionGroup.toString()};
            formatter.applyPattern(messages.getString("ProductionTurnExecuteTurnResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {productionGroup.toString()};
            formatter.applyPattern(messages.getString("ProductionTurnExecuteTurnResponse_failure"));
            logString = formatter.format(messageArgs);
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "PRODUCTION_TURN_START");
        res.addProperty("productionGroup", productionGroup.toString());
        res.addProperty("logString", logString);
        JsonArray cardsJson = new JsonArray();
        for(ProductionCard c : productionCards) {
            cardsJson.add(c.toJson());
        }
        res.add("cards", cardsJson);
        return res.toString();
    }
}
