package it.uniba.hazard.engine.util.response;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Stronghold;
import it.uniba.hazard.engine.main.StrongholdInfo;

import java.util.List;

/**
 * Created by isz_d on 03/03/2017.
 */
public class GetStrongholdInfoResponse implements Response {
    private JsonObject responseJson;

    public GetStrongholdInfoResponse(List<Emergency> emergencies,
                                     List<Stronghold> strongholds,
                                     int currentStrongholdCost,
                                     List<StrongholdInfo> strongholdInfos) {
        responseJson = new JsonObject();
        responseJson.addProperty("currentStrongholdCost", currentStrongholdCost);
        JsonArray strongholdsJ = new JsonArray();
        for(Emergency e : emergencies) {
            JsonObject o = new JsonObject();
            o.addProperty("emergencyID", e.getObjectID());
            o.addProperty("emergencyName", e.getNameEmergency());
            o.addProperty("hasStronghold", isEmergencyCovered(e, strongholds));
            strongholdsJ.add(o);
            for(StrongholdInfo s : strongholdInfos) {
                if (s.getEmergency().equals(e)) {
                    o.addProperty("strongholdName", s.getStrongholdName());
                    o.addProperty("strongholdResource", s.getResourceNeeded().getNameResource());
                }
            }
        }
        responseJson.add("strongholdsInArea", strongholdsJ);
    }

    private boolean isEmergencyCovered(Emergency e, List<Stronghold> strongholds) {
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
