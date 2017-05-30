package it.uniba.hazard.engine.main;

import com.google.gson.JsonElement;
import it.uniba.hazard.engine.util.response.Response;

/**
 * Created by andrea_iovine on 24/12/2016.
 */
public interface Turn {

    public Response executeTurn(GameState state);
    public JsonElement toJson();
}
