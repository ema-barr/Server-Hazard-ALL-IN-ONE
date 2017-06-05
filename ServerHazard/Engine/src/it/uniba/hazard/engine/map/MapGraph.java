package it.uniba.hazard.engine.map;

import org.jgrapht.UndirectedGraph;
import org.jgrapht.graph.AbstractBaseGraph;
import org.jgrapht.graph.ClassBasedEdgeFactory;
import org.jgrapht.graph.DefaultEdge;

public class MapGraph
        extends AbstractBaseGraph<Location, DefaultEdge>
        implements UndirectedGraph<Location, DefaultEdge> {

    public MapGraph() {
        super(new ClassBasedEdgeFactory<Location, DefaultEdge>(
                        DefaultEdge.class),
                true,
                true);
    }
}