package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonElement;

/**
 * Created by isz_d on 02/03/2017.
 */
public class GenericResponse implements Response {
    private JsonElement response;

    public GenericResponse(JsonElement response) {
        this.response = response;
    }

    @Override
    public String toJson() {
        return response.toString();
    }
}
