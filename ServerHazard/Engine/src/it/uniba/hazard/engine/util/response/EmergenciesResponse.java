package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Stronghold;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.Location;

import java.util.List;
import java.util.Set;

/**
 * This Response class shows the emergencies in a location, and for every emergency checks if there is a stronghold
 * in the containing area.
 */
public class EmergenciesResponse implements Response {
    private JsonObject responseJson;

    public EmergenciesResponse(Location l, Area a) {
        responseJson = new JsonObject();
        Set<Emergency> emergencies = l.getEmergencies();
        JsonArray emergJson = new JsonArray();
        List<Stronghold> strongholds = a.getStrongholds();

        //For each emergency, add info about whether a stronghold for that emergency is in place in the area
        for(Emergency e : emergencies) {
            JsonObject ej = e.toJson().getAsJsonObject();
            ej.addProperty("strongholdAvailable", checkStronghold(e, strongholds));
            emergJson.add(ej);
        }
        responseJson.add("emergencies", emergJson);
    }

    private boolean checkStronghold(Emergency e, List<Stronghold> strongholds) {
        //Check if there is a stronghold for the specified emergency
        for (Stronghold s : strongholds) {
            if (s.getEmergency().equals(e)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public String toJson() {
        return responseJson.toString();
    }
}
