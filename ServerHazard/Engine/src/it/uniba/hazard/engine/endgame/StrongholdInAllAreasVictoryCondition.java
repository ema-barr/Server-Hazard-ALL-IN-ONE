package it.uniba.hazard.engine.endgame;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Stronghold;
import it.uniba.hazard.engine.map.Area;

import java.util.List;

/**
 * Created by isz_d on 09/01/2017.
 */
public class StrongholdInAllAreasVictoryCondition implements VictoryCondition {
    public boolean evaluateEndCondition(GameState state) {
        boolean conditionSatisfied = true;
        List<Area> areas = state.getAreas();
        List<Emergency> emergencies = state.getEmergencies();

        for (Area a : areas) {
            //Check for each area if there is a stronghold for each emergency
            List<Stronghold> strongholds = a.getStrongholds();
            for (Emergency e : emergencies) {
                //Check if there is a stronghold for this emergency
                int i = 0;
                boolean found = false;
                while (i < strongholds.size() && !found) {
                    if (strongholds.get(i).getEmergency().getNameEmergency().equals(e.getNameEmergency())) {
                        found = true;
                    }
                    i++;
                }
                if (!found) {
                    //If the stronghold has not been found, the victory condition is not met
                    conditionSatisfied = false;
                }
            }
        }

        return conditionSatisfied;
    }
}
