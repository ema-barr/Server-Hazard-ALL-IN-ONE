package it.uniba.hazard.engine.pawns;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.ResourceNotInPayloadException;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.map.Location;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;

public class TransportPawn implements PlayerPawn{
    private final static java.util.logging.Logger LOGGER = java.util.logging.Logger.getLogger(TransportPawn.class.getName());
    private String objectID;
    private static int id = -1;
    private int thisId;
    private ProductionGroup productionGroup;
    private Provisions payload;
    //private Location location;

    public TransportPawn(ProductionGroup productionGroup, Provisions payload, Location location){
        LOGGER.log(Level.INFO, "Called TransportPawn constructor");
        id++;
        thisId = id;
        objectID = this.getClass().getName() + "_" + productionGroup.toString() + "_" + id;
        LOGGER.log(Level.INFO, "New pawn's ObjectID is " + objectID);
        LOGGER.log(Level.INFO, "thisId is " + thisId);
        this.productionGroup = productionGroup;
        this.payload = payload.clone();
        //this.location = location;
    }

    /*public Location getLocation() {
        return location;
    }*/

    public String getObjectID() {
        return objectID;
    }

    public int getId() {
        return id;
    }

    public ProductionGroup getProductionGroup() {
        return productionGroup;
    }

    public Provisions getPayload() {
        return payload;
    }

    public boolean equals(TransportPawn tp){
        if (objectID.equals(tp.getObjectID())){
            return true;
        } else {
            return false;
        }
    }


    @Override
    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(TransportPawn.class, new TransportPawnSerializer());
        return gb.create().toJsonTree(this);
    }

    @Override
    public String toString() {
        return productionGroup.toString() + "_" + thisId;
    }

    public class TransportPawnSerializer implements JsonSerializer<TransportPawn> {

        @Override
        public JsonElement serialize(TransportPawn transportPawn, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("pawnID", objectID);
            result.addProperty("type", "TransportPawn");
            result.addProperty("group", productionGroup.toString());
            result.add("payload", payload.toJson());
            return result;
    }
    }
}
