package it.uniba.hazard.engine.pawns;

import com.google.gson.*;
import it.uniba.hazard.engine.groups.ActionGroup;

import java.lang.reflect.Type;

//Pedina organizzazione
public class ActionPawn implements  PlayerPawn{
    private String objectID;
    private ActionGroup actionGroup;

    public ActionPawn(ActionGroup actionGroup){
        this.objectID = this.getClass().getName() + "_" + actionGroup.toString();
        this.actionGroup = actionGroup;
    }

    public String getObjectID() {
        return objectID;
    }

    @Override
    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(ActionPawn.class, new ActionPawnSerializer());
        return gb.create().toJsonTree(this);
    }

    public ActionGroup getActionGroup() {
        return actionGroup;
    }

    public class ActionPawnSerializer implements JsonSerializer<ActionPawn> {

        @Override
        public JsonElement serialize(ActionPawn actionPawn, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("pawnID", objectID);
            result.addProperty("type", "ActionPawn");
            result.addProperty("group", actionGroup.getNameActionGroup());
            return result;
        }
    }
}
