package it.uniba.hazard.engine.turn;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.cards.EventCard;
import it.uniba.hazard.engine.cards.EventCardInstance;
import it.uniba.hazard.engine.main.GameState;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.event_turn.EventTurnExecuteTurnResponse;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by maccn on 25/12/2016.
 */

public class EventTurn implements Turn {

    // Lista di carte evento
    private List<EventCard> eventCards;

    // Lista di carte attivate
    private List<EventCardInstance> activatedCards;

    // numero di carte evento da richiedere
    private int numberOfCards;

    // numero di carte evento da attivare
    private int numberOfExecutions;


    // costruttore per modificare il numero di carte da richiedere
    // e il numero di carte da attivare
    public EventTurn (int nc, int ne) {

        numberOfCards = nc;
        eventCards = new ArrayList<>();
        activatedCards = new ArrayList<>();

        // controllo se il numero di carte da attivare è <= di quelle richieste
        if (ne <= numberOfCards)
            numberOfExecutions = ne;
        else
            numberOfExecutions = numberOfCards;


    }

    // metodo da chiamare per eseguire le azioni di inizio turno
    @Override
    public Response executeTurn(GameState gameState) {
        ArrayList<Response> responses = new ArrayList<>();
        revertEventCards(gameState);
        if (numberOfExecutions <= numberOfCards) {
            eventCards = gameState.getEventCards(numberOfCards);
            for (EventCard e : eventCards) {
                // attiva gli effetti della carta evento
                EventCardInstance cardInstance = e.getInstance();
                responses.add(cardInstance.executeAction(gameState, this));
                activatedCards.add(cardInstance);
            }
        }

        return new EventTurnExecuteTurnResponse(true, responses);
    }

    // annulla l'effetto degli eventi del turno precedente
    private void revertEventCards (GameState gameState) {
        if (!activatedCards.isEmpty()) {
            for (EventCardInstance e : activatedCards) {
                e.revertAction(gameState);
            }
            activatedCards.removeAll(activatedCards);
        }
    }

    @Override
    public String toString() {
        return "EventTurn{" +
                "eventCards=" + eventCards +
                ", numberOfCards=" + numberOfCards +
                ", numberOfExecutions=" + numberOfExecutions +
                '}';
    }

    public JsonElement toJson() {
        JsonObject result = new JsonObject();
        result.addProperty("type", "EventTurn");
        return result;
    }
}
