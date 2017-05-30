package it.uniba.hazard.engine.util.response.event_turn;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Created by maccn on 03/03/2017.
 */
public class EventTurnExecuteTurnResponse implements Response {

    private boolean success;
    private List<Response> responses;
    private String logString;

    public EventTurnExecuteTurnResponse (boolean success, List<Response> responses) {
        this.success = success;
        this.responses = responses;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success) {
            Object[] messageArgs = {responses.size()};
            formatter.applyPattern(messages.getString("EventTurnExecuteTurnResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            logString = messages.getString("EventTurnExecuteTurnResponse_failure");
        }
    }

    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        JsonArray responsesArray = new JsonArray();
        for (Response resp: responses){
            responsesArray.add(new JsonParser().parse(resp.toJson()));
        }
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_TURN_START");
        res.add("responses", responsesArray);
        res.addProperty("logString", logString);
        return res.toString();
    }

}
