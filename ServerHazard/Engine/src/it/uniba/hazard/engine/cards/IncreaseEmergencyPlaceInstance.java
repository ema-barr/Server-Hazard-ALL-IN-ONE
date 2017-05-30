package it.uniba.hazard.engine.cards;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.card.IncreaseEmergencyPlaceResponse;

import java.util.*;

/**
 * Instances IncreaseEmergencyPlace.
 * @author Donato
 */
public class IncreaseEmergencyPlaceInstance implements EventCardInstance {
    public String eventType;
    private String objectID;
    private Emergency randomEmergency;


    public IncreaseEmergencyPlaceInstance(String eventType) {
        this.eventType = eventType;
        this.objectID = this.getClass().getSuperclass().getName() + "_" + this.getClass().getName();
    }

    /**
     *
     * @return identification of objectID
     */
    public String getObjectID(){
        return objectID;
    }

    /**
     * Increase the emergency in one place choosen random.
     * @param gameState State of the game
     * @param turn Turn of the game
     * @return the response of IncreaseEmergencyPlace
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
            int randomIndex = (int) ((new Random().nextDouble())*(l.length-1));
            //verifico che ci sia l'emergenza in quella location
            if(l[randomIndex].getEmergencyLevel(randomEmergency) > 0) {
                int currentEmergencyLevel = l[randomIndex].getEmergencyLevel(randomEmergency);
                //aumento di 1 il livello di una emergenza in una location
                Map startLocation = new HashMap<Location,Integer>();

                startLocation.put(l[randomIndex],currentEmergencyLevel);
                gameState.diffuseEmergency(randomEmergency,startLocation);
                return new IncreaseEmergencyPlaceResponse(true, "IncreaseEmergencyPlace", randomEmergency,l[randomIndex],currentEmergencyLevel);
            }
        }
    }

    /**
     * Deletes the effect of the card: IncreaseEmergencyPlace.
     * @param gameState State of the game
     * @return null
     */
    @Override
    public Response revertAction(GameState gameState) {
        return null;
    }
}
