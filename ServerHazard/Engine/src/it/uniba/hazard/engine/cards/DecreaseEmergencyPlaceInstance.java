package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.DecreaseEmergencyPlaceResponse;

import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 * Instances DecreaseEmergencyPlace.
 * @author Donato
 */
public class DecreaseEmergencyPlaceInstance implements EventCardInstance{
    public String eventType;
    private String objectID;
    private int currentEmergencyLevel;
    private Emergency randomEmergency;


    public DecreaseEmergencyPlaceInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID() {
        return objectID;
    }

    /**
     * Decrease the emergency in one place choosen random.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of DecreaseEmergencyPlace
     */
    @Override
    public Response executeAction(GameState gameState, Turn turn) {
        List<Emergency> listEmergency =  gameState.getEmergencies();
        Set<Location> listLocation = gameState.getMapLocations();
        //prendo un' emergenza random
        randomEmergency = listEmergency.get(new Random().nextInt(listEmergency.size()));

        Location[] l = new Location[listLocation.size()];
        listLocation.toArray(l);

        while(true){
            int randomIndex = new Random().nextInt(l.length-1);
            //verifico che ci sia l'emergenza in quella location
            if(l[randomIndex].getEmergencyLevel(randomEmergency) > 0) {
                currentEmergencyLevel = l[randomIndex].getEmergencyLevel(randomEmergency);

                //diminuisco di 1 il livello di una emergenza in una location
                l[randomIndex].setEmergencyLevel(randomEmergency, currentEmergencyLevel-1);
                return new DecreaseEmergencyPlaceResponse(true, "DecreaseEmergencyPlace", randomEmergency,l[randomIndex],currentEmergencyLevel-1);
            }
        }
    }

    /**
     * Deletes the effect of the card: DecreaseEmergencyPlace.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        return null;
    }
}
