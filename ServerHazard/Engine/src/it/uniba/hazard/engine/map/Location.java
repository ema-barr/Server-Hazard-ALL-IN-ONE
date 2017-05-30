package it.uniba.hazard.engine.map;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.InvalidEmergencyLevelException;
import it.uniba.hazard.engine.main.Emergency;

import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Created by andrea_iovine on 24/12/2016.
 */
public class Location implements Comparable<Location>{
    private String objectID;
    private String name;
    private Map<Emergency, Integer> emergencyLevels;
    private boolean isQuarantined;

    public Location(String name, List<Emergency> emergencies) {
        this.objectID = this.getClass().getName() + "_" + name;
        this.name = name;
        emergencyLevels = new HashMap<Emergency, Integer>();
        isQuarantined = false;

        for(Emergency e : emergencies) {
            emergencyLevels.put(e, 0);
        }
    }

    public String getObjectID() {
        return objectID;
    }

    //WARNING: Do not call this outside of the GameState class
    public void setEmergencyLevel(Emergency e, int level) {
        if (level < 0) {
            throw new InvalidEmergencyLevelException("The value is not allowed.");
        }
        if (emergencyLevels.containsKey(e)) {
            emergencyLevels.remove(e);
        }
        emergencyLevels.put(e, level);
    }

    public Set<Emergency> getEmergencies() {
        return emergencyLevels.keySet();
    }

    //WARNING: Do not call this outside of the GameState class
    public void setQuarantined(boolean isQuarantined) {
        this.isQuarantined = isQuarantined;
    }

    public int getEmergencyLevel(Emergency e) {
        return emergencyLevels.get(e);
    }

    public String toString() {
        return this.name;
    }

    public int compareTo(Location o) {
        return name.compareTo(o.name);
    }

    public boolean isQuarantined() {
        return isQuarantined;
    }

    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(Location.class, new LocationSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public class LocationSerializer implements JsonSerializer<Location> {

        @Override
        public JsonElement serialize(Location location, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject res = new JsonObject();
            res.addProperty("name", Location.this.name);
            res.addProperty("locationID", Location.this.objectID);
            JsonArray emergencyLevelsJson = new JsonArray();
            for (Emergency e : emergencyLevels.keySet()) {
                JsonObject j = new JsonObject();
                j.addProperty("emergency", e.getNameEmergency());
                j.addProperty("level", emergencyLevels.get(e));
                emergencyLevelsJson.add(j);
            }
            res.addProperty("isQuarantined", isQuarantined);
            res.add("emergencyLevels", emergencyLevelsJson);
            return res;
        }
    }
}
