package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.AddBlockadeResponse;

import java.util.ArrayList;
import java.util.Set;

/**
 * Instances AddBlockade.
 * @author Donato
 */
public class AddBlockadeInstance implements EventCardInstance{

    private String objectID;
    private Location l1;
    private ArrayList<Location> locationsBlockade;
    public String eventType;

    public AddBlockadeInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of the ObjectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     * performs the block between location choosen random
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of AddBlockade
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        locationsBlockade = new ArrayList<Location>();
        Set<Location> allLocations =  gameState.getMapLocations();
        ArrayList<Location> l = new ArrayList<Location>(allLocations);


        int index = (int) (Math.random() * allLocations.size()-1);

        //preso primo nodo
        l1 = l.get(index);
        locationsBlockade.add(l1);

        //prese locazioni adiacenti al primo nodo
        Set<Location> l2 = gameState.getAdjacentLocations(l1);
        ArrayList<Location> locationSecondNode = new ArrayList<Location>(l2);

        for (Location loc: locationSecondNode){
            //blocco sulla tratta
            gameState.block(l1, loc);
            locationsBlockade.add(loc);
        }

        System.out.println(new AddBlockadeResponse(true, "AddBlockade", locationsBlockade, l1).toJson());
        return new AddBlockadeResponse(true, "AddBlockade", locationsBlockade, l1);
    }

    /**
     * Deletes the effect of the card: AddBlockade
     * @param gameState State of the game
     * @return null
     */
    public Response revertAction(GameState gameState) {
        for (int i = 1; i< locationsBlockade.size(); i++){
            Location loc = locationsBlockade.get(i);
            gameState.unblock(l1, loc);
        }
        return null;
    }
}
