package it.uniba.hazard.engine.turn;

import com.google.gson.*;
import com.sun.media.jfxmedia.logging.Logger;
import it.uniba.hazard.engine.cards.ProductionCard;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.GameState;

import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.Response;
import it.uniba.hazard.engine.util.response.production_group.InsertNewTransportPawnResponse;
import it.uniba.hazard.engine.util.response.production_group.MoveTransportPawnResponse;
import it.uniba.hazard.engine.util.response.production_turn.ChooseProductionCardResponse;
import it.uniba.hazard.engine.util.response.production_turn.GetProductionCardsResponse;
import it.uniba.hazard.engine.util.response.production_turn.ProductionTurnExecuteTurnResponse;

import java.util.*;
import java.lang.reflect.Type;
import java.util.List;
import java.util.logging.Level;


/**
 * Created by maccn on 25/12/2016.
 */
public class ProductionTurn implements PlayerTurn {
    private final static java.util.logging.Logger LOGGER = java.util.logging.Logger.getLogger(ProductionTurn.class.getName());

    private enum StateTurn {
        CHOOSE_PRODUCTION_CARDS,
        MOVE_TRANSPORT_PAWN
    }


    private StateTurn state;

    // attributo rappresentante il gruppo produzione
    private ProductionGroup player;

    private int remainingActions; // numero di azioni rimanenti per il turno corrente
    private List<ProductionCard> productionCards;

    // numero di carte presentate ad inizio turno
    private int numberOfCards;

    // numero di carte produzione da scegliere
    private int numberOfChoose;

    // lista di carte produzione scelte
    private ArrayList<Integer> selectedCards;

    // numero massimo di pedine presenti contemporaneamente sulla mappa
    private int maxPawns;

    // numero massimo di spostamenti per ogni pedina trasporto
    private int numActions;


    // dizionario contenente le pedine trasporto e il numero di spostamenti
    // disponibili per ogni pedina
    private HashMap<TransportPawn,Integer> pawns;

    public ProductionTurn (ProductionGroup player, int numberOfCards, int maxPawns, int numActions, int numberOfChoose) {
        this.player = player;
        this.numberOfCards = numberOfCards;
        this.maxPawns = maxPawns;
        this.numActions = numActions;
        this.numberOfChoose = numberOfChoose;
        productionCards = new ArrayList<>();
        pawns = new HashMap<>();
        selectedCards = new ArrayList<>();
    }

    public ProductionGroup getPlayer() {
        return player;
    }

    // metodo da eseguire a inizio turno
    // pesca un numero di ProductionCard pari a numberOfCards
    @Override
    public Response executeTurn(GameState gameState) {
        LOGGER.log(Level.INFO, "Called ProductionTurn.executeTurn method");
        pawns.clear();
        List<TransportPawn> tps = player.getTransportPawns();
        for (TransportPawn tp : tps) {
            pawns.put(tp, numActions);
        }
        int numCurrentPawns = tps.size();
        selectedCards.clear();

        if (numCurrentPawns < maxPawns) {
            //If the max number of pawns has not been reached, extract cards
            LOGGER.log(Level.INFO, "Extracting production cards...");
            productionCards = gameState.getProductionCards(numberOfCards);
            //Set the number of cards that can be extracted in this turn
            numberOfChoose = gameState.getNumberOfProductionCards();
            LOGGER.log(Level.INFO, "numberOfChoose=" + numberOfChoose + ",productionCards.size=" + productionCards.size());
            if (productionCards.size() > 0 && numberOfChoose > 0) {
                LOGGER.log(Level.INFO, "The production group can choose " + numberOfChoose + " cards");
                state = StateTurn.CHOOSE_PRODUCTION_CARDS;
            } else {
                //If no cards can be chosen, set to movement state
                LOGGER.log(Level.INFO, "The production group cannot choose cards.");
                state = StateTurn.MOVE_TRANSPORT_PAWN;
            }

            return new ProductionTurnExecuteTurnResponse(true, player, productionCards);
        } else {
            //If the max number of pawns has been reached, set to movement state
            LOGGER.log(Level.INFO, "The production group has already max number of transport pawns");
            state = StateTurn.MOVE_TRANSPORT_PAWN;
            return new ProductionTurnExecuteTurnResponse(false, player, null);
        }
    }


    // metodo per richiamare i metodi rappresentanti le azioni
    @Override
    public Response runCommand(GameState gameState, String [] param) {

        Response resp = null;
        switch (param[0]) {
            case "chooseCard":
                resp = this.chooseCard(gameState, param[1]);
                break;
            case "movePawn":
                resp = this.movePawn(gameState, param[1], param[2]);
                break;
            case "getProductionCards":
                resp = this.getProductionCards(gameState);
                break;
        }

        return resp;
    }

    private void updatePawns() {
        pawns.clear();
        List<TransportPawn> tps = player.getTransportPawns();
        for (TransportPawn tp : tps) {
            pawns.put(tp, numActions);
        }
    }


    // metodo per scegliere la carta produzione e inserire un nuovo TransportPawn
    private Response chooseCard (GameState gameState, String cardStr) {
        LOGGER.log(Level.INFO, "Entered chooseCard method.");
        int numCard = Integer.valueOf(cardStr);
        LOGGER.log(Level.INFO, "Card number is " + numCard);
        Response resp = null;
        if (state == StateTurn.CHOOSE_PRODUCTION_CARDS) {
            LOGGER.log(Level.INFO, "Current state is CHOOSE_PRODUCTION_CARDS");
            if (!selectedCards.contains(numCard)) {
                if (selectedCards.size() < numberOfChoose) {
                    if (numCard >= 0 & numCard < productionCards.size()) {
                        ProductionCard prodCard = productionCards.get(numCard);
                        LOGGER.log(Level.INFO, "Selected Production card is " + prodCard.toJson().toString());
                        prodCard.executeAction(gameState, this);
                        selectedCards.add(numCard);
                        resp = player.insertNewTransportPawn(gameState, new Provisions(prodCard.getResource()), prodCard.getLocation());
                        updatePawns();
                        if (pawns.size() == maxPawns) {
                            LOGGER.log(Level.INFO, "Max number of transport pawns reached");
                            state = StateTurn.MOVE_TRANSPORT_PAWN;
                        }
                    } else {
                        // The selected card is not available
                        LOGGER.log(Level.INFO, "Card " + numCard + " is not available");
                        resp = new ChooseProductionCardResponse(false, player);
                    }
                } else {
                    // il numero di scelte massimo è stato raggiunto
                    LOGGER.log(Level.INFO, "Cannot choose card because the max limit has already been reached.");
                    resp = new ChooseProductionCardResponse(false, player);
                }
            } else {
                // la carta è stata già scelta
                LOGGER.log(Level.INFO, "Card " + numCard + " was already chosen");
                resp = new ChooseProductionCardResponse(false, player);
            }
            //Once the specified number of production cards has been chosen, the production turn switches into movement mode
            if (selectedCards.size() >= numberOfChoose || (productionCards.size() - selectedCards.size()) == 0) {
                LOGGER.log(Level.INFO, "Reached max number of cards selectable. Changing state to MOVE_TRANSPORT_PAWN");
                LOGGER.log(Level.INFO, "numberOfChoose=" + numberOfChoose, ",selectedCards.size=" + selectedCards.size() + ",productionCards.size=" + productionCards.size());
                state = StateTurn.MOVE_TRANSPORT_PAWN;
            }
        } else {
            LOGGER.log(Level.INFO, "State is MOVE_TRANSPORT_PAWN, cannot choose cards");
            //If the production group currently cannot select cards, send a failure response
            resp = new ChooseProductionCardResponse(false, player);
        }

        return resp;
    }

    private Response movePawn (GameState gameState, String pawnStr, String newLocationStr) {
        // metodo per muovere le pedine
        LOGGER.log(Level.INFO, "Called movePawn method");
        LOGGER.log(Level.INFO, "Pawn's objectID is " + pawnStr);
        LOGGER.log(Level.INFO, "Destination id is " + newLocationStr);
        state = StateTurn.MOVE_TRANSPORT_PAWN;
        Response resp;
        Location newLocation = (Location) Repository.getFromRepository(newLocationStr);
        LOGGER.log(Level.INFO, "Location got from Repository is " + newLocation.getObjectID());
        TransportPawn tp = (TransportPawn) Repository.getFromRepository(pawnStr);
        LOGGER.log(Level.INFO, "Pawn got from Repository is " + tp.getObjectID());
        LOGGER.log(Level.INFO, "Pawn's number of available movements is " + pawns.get(tp));
        if (pawns.get(tp) > 0) {
            LOGGER.log(Level.INFO, "Pawn can be moved");
            resp = player.moveTransportPawn(gameState, tp, newLocation);
            if (((MoveTransportPawnResponse) resp).success()) {
                //Reduce the number of movements only if the movement has been executed
                pawns.put(tp, pawns.get(tp)-1);
            }
        } else {
            LOGGER.log(Level.INFO, "Cannot move pawn, because it has 0 movements available");
            resp = new MoveTransportPawnResponse (false, tp, newLocation);
        }

        return resp;
    }

    private Response getProductionCards (GameState gameState) {
        return new GetProductionCardsResponse(true, player, productionCards);
    }

    public StateTurn getState() {
        return state;
    }




    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(ProductionTurn.class, new ProductionTurnSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public class ProductionTurnSerializer implements JsonSerializer<ProductionTurn> {

        @Override
        public JsonElement serialize(ProductionTurn productionTurn, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("type", "ProductionTurn");
            result.add("group", player.toJson());
            JsonArray cardsJson = new JsonArray();
            for(ProductionCard c : productionCards) {
                cardsJson.add(c.toJson());
            }
            result.add("cards", cardsJson);
            result.addProperty("state", state.toString());
            JsonArray pawnMovementsJson = new JsonArray();
            for (TransportPawn tp : pawns.keySet()) {
                JsonObject pj = new JsonObject();
                pj.addProperty("pawnID", tp.getObjectID());
                pj.addProperty("remainingMoves", pawns.get(tp));
                pawnMovementsJson.add(pj);
            }
            result.add("pawnMoves", pawnMovementsJson);
            return result;
        }
    }
}
