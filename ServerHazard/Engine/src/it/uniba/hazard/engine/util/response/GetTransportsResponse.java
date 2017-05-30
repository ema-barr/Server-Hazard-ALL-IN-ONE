package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.pawns.TransportPawn;

import java.util.List;

/**
 * This response class contains all the transport pawns located in the specified location, and for each one shows the
 * resources that can be withdrawn by the specified Action Group.
 */
public class GetTransportsResponse implements Response {
    private JsonObject responseJson;

    public GetTransportsResponse(List<TransportPawn> transports, ActionGroup group) {
        responseJson = new JsonObject();
        List<Resource> usedResources = group.getUsedRes();
        JsonArray pawnsJ = new JsonArray();
        for (TransportPawn tp : transports) {
            //For each transport pawn, add all the resources used by the action group
            JsonObject pawnJ = new JsonObject();
            Provisions responseProv = new Provisions();
            Provisions p = tp.getPayload();
            for (Resource r : p.getListResources()) {
                if (usedResources.contains(r)) {
                    responseProv.addResource(r, p.getQuantity(r));
                }
            }
            pawnJ.addProperty("pawnID", tp.getObjectID());
            pawnJ.add("payload", responseProv.toJson());
            pawnsJ.add(pawnJ);
        }
        responseJson.add("pawns", pawnsJ);
    }

    @Override
    public String toJson() {
        return responseJson.toString();
    }
}
