package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.map.Location;

import java.util.Set;

/**
 * Created by isz_d on 02/03/2017.
 */
public class AdjacentLocationsResponse implements Response{
    JsonObject responseJson;
    public AdjacentLocationsResponse(Set<Location> locations) {
        responseJson = new JsonObject();
        JsonArray locationsJson = new JsonArray();
        for (Location l : locations) {
            locationsJson.add(l.toJson());
        }
        responseJson.add("locations", locationsJson);
    }

    @Override
    public String toJson() {
        return responseJson.toString();
    }
}
