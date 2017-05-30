package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonObject;

/**
 * Created by isz_d on 09/03/2017.
 */
public class NoActionAvailableResponse implements Response {
    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", false);
        res.addProperty("actionName", "ACTION_TURN_NO_MORE_ACTIONS");
        res.addProperty("logString", "Non è possibile compiere altre azioni.");
        return res.toString();
    }
}
