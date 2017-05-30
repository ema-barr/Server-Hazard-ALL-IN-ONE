package it.uniba.hazard.engine.endgame;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.GamePawn;

import java.util.List;
import java.util.Set;

/**
 * Created by isz_d on 09/01/2017.
 */
public class ContagionPercentageLossCondition implements LossCondition {
    public static final double MAX_CONTAGION_PERCENTAGE = 0.7;

    public boolean evaluateEndCondition(GameState state) {
        boolean conditionSatisfied = false;
        Set<Location> locations = state.getMapLocations();
        List<Emergency> emergencies = state.getEmergencies();
        int numOfLocations = locations.size();
        //Contains the number of locations with maximum level for each emergency
        int[] maxEmergencyLocations = new int[emergencies.size()];

        //Initialize the array
        for (int i = 0; i < maxEmergencyLocations.length; i++) {
            maxEmergencyLocations[i] = 0;
        }

        for (Location l : locations) {
            for (int i = 0; i < emergencies.size(); i++) {
                //For each emergency, check if the location has maximum level
                Emergency e = emergencies.get(i);
                if (l.getEmergencyLevel(e) == state.getMaxEmergencyLevel()) {
                    maxEmergencyLocations[i]++;
                }
            }
        }

        for (int num : maxEmergencyLocations) {
            //Calculate the ratio of locations with maximum level for each emergency
            double ratio = ((double) num) / ((double) locations.size());
            if (ratio >= MAX_CONTAGION_PERCENTAGE) {
                //The loss condition occurred
                conditionSatisfied = true;
            }
        }

        return conditionSatisfied;
    }
}
