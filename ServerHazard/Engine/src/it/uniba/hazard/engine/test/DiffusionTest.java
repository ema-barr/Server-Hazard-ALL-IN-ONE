package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.endgame.ContagionPercentageLossCondition;
import it.uniba.hazard.engine.endgame.LossCondition;
import it.uniba.hazard.engine.endgame.StrongholdInAllAreasVictoryCondition;
import it.uniba.hazard.engine.endgame.VictoryCondition;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.GeneralHazardIndicator;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.GameMap;
import it.uniba.hazard.engine.map.Location;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.SimpleGraph;

import java.util.*;

/**
 * Created by isz_d on 21/01/2017.
 */
/*public class DiffusionTest {
    public static void main(String[] args) {
        Emergency e = new Emergency("malattia");
        List<Emergency> emergencies = new ArrayList<>();
        emergencies.add(e);

        Graph<Location, DefaultEdge> mapGraph = new SimpleGraph<Location, DefaultEdge>(DefaultEdge.class);
        Location l1 = new Location("bari", emergencies);
        Location l2 = new Location("barletta", emergencies);
        Location l3 = new Location("bitonto", emergencies);
        Location l4 = new Location("trani", emergencies);

        List<Location> locations = new ArrayList<>();
        locations.add(l1);
        locations.add(l2);
        locations.add(l3);
        locations.add(l4);

        Area a = new Area(locations);
        List<Area> areas = new ArrayList<>();
        areas.add(a);

        List<Integer> steps = new ArrayList<>();
        steps.add(1);
        steps.add(2);
        GeneralHazardIndicator ghi = new GeneralHazardIndicator(steps);

        Map<Emergency, GeneralHazardIndicator> indicators = new HashMap<>();
        indicators.put(e, ghi);


        mapGraph.addVertex(l1);
        mapGraph.addVertex(l2);
        mapGraph.addVertex(l3);
        mapGraph.addVertex(l4);

        mapGraph.addEdge(l1, l2);
        mapGraph.addEdge(l2, l3);
        mapGraph.addEdge(l3, l4);
        mapGraph.addEdge(l4, l1);

        GameMap map = new GameMap(mapGraph, areas);

        List<VictoryCondition> vcond = new ArrayList<>();
        vcond.add(new StrongholdInAllAreasVictoryCondition());

        List<LossCondition> lcond = new ArrayList<>();
        lcond.add(new ContagionPercentageLossCondition());

        GameState state = new GameState(map,
                indicators,
                null,
                null,
                null,
                emergencies,
                vcond,
                lcond,
                null
        );

        System.out.println(state.getCurrentState());

        locations.remove(l4);

        Map<Location, Integer> locem = new HashMap<>();
        locem.put(l1, 4);
        locem.put(l2, 2);
        state.diffuseEmergency(e, locem);
        Set<Location> locs = state.getMapLocations();

        for(Location l : locations) {
            System.out.println(l.toString() + " " + l.getEmergencyLevel(e));
        }
    }
}*/
