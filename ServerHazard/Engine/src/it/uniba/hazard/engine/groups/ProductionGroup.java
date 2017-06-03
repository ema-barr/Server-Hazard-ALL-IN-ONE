package it.uniba.hazard.engine.groups;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.CannotMovePawnException;
import it.uniba.hazard.engine.exception.MaxNumberOfTransportPawnsReachedException;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.production_group.InsertNewTransportPawnResponse;
import it.uniba.hazard.engine.util.response.production_group.MoveTransportPawnResponse;
import it.uniba.hazard.engine.util.response.production_group.RemoveTransportPawnResponse;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Set;

public class ProductionGroup {
    private String objectID;
    private List<TransportPawn> pawns;
    private String nameProductionGroup;
    private int maxTransportPawns;


    public ProductionGroup(List<TransportPawn> pawns, String nameProductionGroup, int maxTransportPawns) {
        this.objectID = this.getClass().getName() + "_" + nameProductionGroup;
        this.nameProductionGroup = nameProductionGroup;
        this.pawns = pawns;
        this.maxTransportPawns = maxTransportPawns;
    }

    public int getMaxTransportPawns() {
        return maxTransportPawns;
    }

    /*public void insertNewTransportPawn(GameState state, Location location){
        int numTransportPawns = pawns.size();
        if (numTransportPawns < maxTransportPawns){
            TransportPawn pawn = new TransportPawn(this, location);
            pawns.add(pawn);
            state.addTransportPawn(pawn, location);
        } else {
            throw new MaxNumberOfTransportPawnsReachedException("Max number of transport pawns reached");
        }

    }*/

    public InsertNewTransportPawnResponse insertNewTransportPawn(GameState state, Provisions payloadToInsert, Location location){
        InsertNewTransportPawnResponse insertNewTransportPawnResponse;
        Provisions payload = payloadToInsert.clone();
        int numTransportPawns = pawns.size();
        TransportPawn pawn = null;
        if (numTransportPawns < maxTransportPawns){
            pawn = new TransportPawn(this, payload, location);
            state.addTransportPawn(pawn, location);
            pawns.add(pawn);
            insertNewTransportPawnResponse = new InsertNewTransportPawnResponse(true, location, pawn);
        }else {
            //throw new MaxNumberOfTransportPawnsReachedException("Max number of transport pawns reached");
            insertNewTransportPawnResponse = new InsertNewTransportPawnResponse(false, location, pawn);
        }
        return insertNewTransportPawnResponse;
    }

    public RemoveTransportPawnResponse removeTransportPawn(TransportPawn transportPawn){
        RemoveTransportPawnResponse removeTransportPawnResponse;

        boolean remove = pawns.remove(transportPawn);
        removeTransportPawnResponse = new RemoveTransportPawnResponse(true, transportPawn);
        if (!remove){
            //throw new TransportPawnNotFoundException("Transport pawn " + transportPawn.getObjectID() + " does not exist");
            removeTransportPawnResponse = new RemoveTransportPawnResponse(false, transportPawn);
        }
        return removeTransportPawnResponse;
    }

    public List<TransportPawn> getTransportPawns() {
        return pawns;
    }

    public String getObjectID() {
        return objectID;
    }

    public MoveTransportPawnResponse moveTransportPawn(GameState state, TransportPawn transportPawn, Location location){
        MoveTransportPawnResponse moveTransportPawnResponse;

        Set<Location> adjacentLocations = state.getAdjacentLocations(transportPawn);
        boolean found = false;
        for (Location adjLoc: adjacentLocations){
            if (adjLoc.toString().equals(location.toString())){
                found = true;
                break;
            }
        }
        if (found){
            try {
                state.movePawn(transportPawn, location);
                moveTransportPawnResponse = new MoveTransportPawnResponse(true, transportPawn, location);
            } catch (CannotMovePawnException e) {
                moveTransportPawnResponse = new MoveTransportPawnResponse(false, transportPawn, location, e);
            }
        } else {
            //throw new CannotMovePawnException("Invalid location");
            moveTransportPawnResponse = new MoveTransportPawnResponse(false, transportPawn, location);
        }
        return moveTransportPawnResponse;
    }

    @Override
    public String toString() {
        return nameProductionGroup;
    }

    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(ProductionGroup.class, new ProductionGroupSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public class ProductionGroupSerializer implements JsonSerializer<ProductionGroup> {

        @Override
        public JsonElement serialize(ProductionGroup productionGroup, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("name", nameProductionGroup);
            JsonArray transportJson = new JsonArray();
            for (TransportPawn tp : pawns) {
                transportJson.add(tp.toJson());
            }
            result.add("transportPawns", transportJson);
            return result;
        }
    }
}
