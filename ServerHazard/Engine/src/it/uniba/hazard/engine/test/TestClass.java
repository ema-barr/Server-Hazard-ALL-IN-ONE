package it.uniba.hazard.engine.test;

//import it.uniba.hazard.engine.main.ExampleTurn;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.GameMap;
import it.uniba.hazard.engine.map.Location;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.SimpleGraph;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Created by andrea_iovine on 26/12/2016.
 */
/*public class TestClass {
    public static void main(String[] args) {
        Graph<Location, DefaultEdge> mapGraph = new SimpleGraph<Location, DefaultEdge>(DefaultEdge.class);
        Location l1 = new Location("bari");
        Location l2 = new Location("barletta");
        Location l3 = new Location("bitonto");
        Location l4 = new Location("trani");

        mapGraph.addVertex(l1);
        mapGraph.addVertex(l2);
        mapGraph.addVertex(l3);
        mapGraph.addVertex(l4);

        mapGraph.addEdge(l1, l2);
        mapGraph.addEdge(l2, l3);
        mapGraph.addEdge(l3, l4);
        mapGraph.addEdge(l4, l1);

        GameMap map = new GameMap(mapGraph, null);

        Turn t1 = new ExampleTurn(1);
        Turn t2 = new ExampleTurn(2);

        List<Turn> turnOrder = new ArrayList<Turn>();
        turnOrder.add(t1);
        turnOrder.add(t2);

        GameState state = new GameState(map,null, null, null, null);

        Game g = new Game(state, turnOrder);

        Scanner s = new Scanner(System.in);
        while (true) {
            g.nextTurn();
            s.nextLine();
        }
    }
}*/
