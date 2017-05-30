package it.uniba.hazard.engine.map;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.CannotCreateBlockadeException;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Created by andrea_iovine on 05/01/2017.
 * A Blockade represents a block that prevents passage from one location to another.
 * Neither players nor emergencies can pass through a blockade.
 */
public class Blockade {
    private Set<Location> locations;

    public Blockade(Location location1, Location location2) {
        locations = new HashSet<Location>();
        if (!location1.equals(location2)) {
            locations.add(location1);
            locations.add(location2);
        } else {
            throw new CannotCreateBlockadeException("The locations must be different");
        }
    }

    public Set<Location> getLocations() {
        return locations;
    }

    public boolean contains(Location l1, Location l2) {
        return locations.contains(l1) && locations.contains(l2);
    }

    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(Blockade.class, new BlockadeSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public class BlockadeSerializer implements JsonSerializer<Blockade> {

        @Override
        public JsonElement serialize(Blockade blockade, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            JsonArray locJson = new JsonArray();
            for(Location l : locations) {
                locJson.add(l.toString());
            }
            result.add("locations", locJson);
            return result;
        }
    }
}
