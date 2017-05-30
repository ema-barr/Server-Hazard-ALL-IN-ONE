package it.uniba.hazard.engine.main;

import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.GamePawn;

import java.util.Set;

/**
 * Created by andrea_iovine on 26/12/2016.
 * Classe Turno esempio, per spiegare il meccanismo dei turni.
 */
/*public class ExampleTurn implements Turn {
    private int groupNumber;
    private GamePawn examplePiece;

    public ExampleTurn(int groupNumber) {
        this.groupNumber = groupNumber;
        examplePiece = new ActionPawn();
    }

    public void executeTurn(GameState state) {
        System.out.println("Turn executed by group " + groupNumber);
        Set<Location> locations;
        if (!state.mapContainsPawn(examplePiece)) {
            //Put the piece in any of the map locations
            locations = state.getMapLocations();
        } else {
            Location currentLocation = state.getLocationInMap(examplePiece);
            System.out.println("Piece is currently in location " + currentLocation);
            //Move the piece in one of the adjacent locations
            locations = state.getAdjacentLocations(examplePiece);
        }

        Location[] locArray = locations.toArray(new Location[locations.size()]);

        //Get a random location to put the piece
        int randomIndex = (int) (locArray.length * Math.random());
        Location selectedLocation = locArray[randomIndex];

        //Put the piece in that location
        state.placePawn(examplePiece, selectedLocation);
        System.out.println("Put the pawn in location " + selectedLocation);
    }
}*/
