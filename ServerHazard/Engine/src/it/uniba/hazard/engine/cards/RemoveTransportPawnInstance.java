package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.GamePawn;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.DefaultCardResponse;
import it.uniba.hazard.engine.util.response.card.RemoveTransportPawnNoPawnsResponse;
import it.uniba.hazard.engine.util.response.card.RemoveTransportPawnResponse;

import java.util.*;

/**
 * Instances RemoveTransportPawn.
 * @author Donato
 */
public class RemoveTransportPawnInstance implements EventCardInstance {
    public String eventType;
    private String objectID;


    public RemoveTransportPawnInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID.
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     * Remove transport pawn from one place choosen random.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of RemoveTransportPawn
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        List<GamePawn> allPawns = new ArrayList<>();
        allPawns.addAll(gameState.getAllPawns().keySet());

        //Get all the transport pawns
        List<TransportPawn> transportPawns = getTransportPawns(allPawns);

        if (transportPawns.size() > 0) {
            int randomIndex = (int) (Math.random() * (transportPawns.size() - 1));
            TransportPawn selected = transportPawns.get(randomIndex);

            //Get the location before the pawn is removed
            Location l = gameState.getLocationInMap(selected);

            gameState.removePawn(selected);

            return new RemoveTransportPawnResponse(true, selected, l);
        }

        //If there were no transport pawns, still send a success, but with a different message
        return new RemoveTransportPawnNoPawnsResponse(true, "RemoveTransportPawn");
    }

    /*
     * Gets all the transport pawns given the entire pawn list
     */
    private List<TransportPawn> getTransportPawns(List<GamePawn> pawns) {
        List<TransportPawn> result = new ArrayList<>();
        for (GamePawn p: pawns) {
            if (p instanceof TransportPawn) {
                result.add((TransportPawn) p);
            }
        }
        return result;
    }

    /**
     * Deletes the effect of the card: RemoveTransportPawn.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        return null;
    }
}
