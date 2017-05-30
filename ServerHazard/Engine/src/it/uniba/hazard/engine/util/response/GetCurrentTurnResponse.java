package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.turn.ProductionTurn;

import java.util.Map;

/**
 * Created by isz_d on 02/03/2017.
 */
public class GetCurrentTurnResponse implements Response {
    Turn currentTurn;
    JsonObject responseJson;
    public GetCurrentTurnResponse(ActionTurn turn, ActionPawn pawn, Location pawnLocation) {
        responseJson = turn.toJson().getAsJsonObject();
        JsonObject pawnJson = pawn.toJson().getAsJsonObject();
        pawnJson.add("location", pawnLocation.toJson());
        responseJson.add("pawn", pawnJson);
    }

    public GetCurrentTurnResponse(ProductionTurn turn, Map<TransportPawn, Location> pawns) {
        responseJson = turn.toJson().getAsJsonObject();
        JsonArray pawnsJson = new JsonArray();
        for(TransportPawn tp: pawns.keySet()) {
            JsonObject pl = new JsonObject();
            pl.addProperty("pawnID", tp.getObjectID());
            pl.add("location", pawns.get(tp).toJson());
            pawnsJson.add(pl);
        }
        responseJson.add("pawnLocations", pawnsJson);
    }


    @Override
    public String toJson() {
        return responseJson.toString();
    }
}
