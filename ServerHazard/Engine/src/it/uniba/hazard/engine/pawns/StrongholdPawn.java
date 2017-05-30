package it.uniba.hazard.engine.pawns;

import com.google.gson.*;
import it.uniba.hazard.engine.main.Stronghold;

import java.lang.reflect.Type;

public class StrongholdPawn implements GamePawn {
    private String objectID;
    private Stronghold stronghold;

    public StrongholdPawn(Stronghold stronghold){
        objectID = this.getClass().getName() + "_" + stronghold.toString();
    }

    public String getObjectID() {
        return objectID;
    }

    public Stronghold getStronghold() {
        return stronghold;
    }

    public boolean equals(StrongholdPawn sp){
        if (this.objectID.equals(sp.getObjectID())){
            return true;
        } else {
            return false;
        }
    }

    @Override
    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(ActionPawn.class, new StrongholdPawnSerializer());
        return gb.create().toJsonTree(this);
    }

    @Override
    public String toString() {
        return stronghold.toString();
    }

    public class StrongholdPawnSerializer implements JsonSerializer<StrongholdPawn> {
        @Override
        public JsonElement serialize(StrongholdPawn strongholdPawn, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("pawnID", objectID);
            result.addProperty("type", "StrongholdPawn");
            result.addProperty("forEmergency", stronghold.getStrongholdInfo().getEmergency().getNameEmergency());
            return result;
        }
    }
}
