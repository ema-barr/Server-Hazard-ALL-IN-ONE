package it.uniba.hazard.engine.pawns;

import com.google.gson.JsonElement;

public interface GamePawn {
    public String getObjectID();
    public JsonElement toJson();
}
