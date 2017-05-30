package it.uniba.hazard.engine.main;

import com.google.gson.*;
import it.uniba.hazard.engine.cards.*;
import it.uniba.hazard.engine.endgame.LossCondition;
import it.uniba.hazard.engine.endgame.VictoryCondition;
import it.uniba.hazard.engine.exception.*;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.Blockade;
import it.uniba.hazard.engine.map.GameMap;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.GamePawn;
import it.uniba.hazard.engine.pawns.StrongholdPawn;
import it.uniba.hazard.engine.pawns.TransportPawn;

import java.lang.reflect.Type;
import java.util.*;

/**
 * Created by andrea_iovine on 24/12/2016.
 */
public class GameState {
    private enum EndState {
        GAME_ACTIVE,
        GAME_VICTORY,
        GAME_LOSS
    };

    private GameMap gameMap;
    private CardManager<BonusCard> bonusCardManager;
    private CardManager<ProductionCard> prodCardManager;
    private CardManager<EventCard> eventCardManager;
    private List<Blockade> blockades;
    private List<Emergency> emergencies;
    private List<Location> lastDiffusedLocations;
    private List<VictoryCondition> victoryConditions;
    private List<LossCondition> lossConditions;
    private int numberOfProductionCards;
    private EndState currentState;
    private Repository repository;
    private int currentStrongholdCost;
    private TurnSequence turns;

    private int defaultStrongholdCost;
    private int maxEmergencyLevel;
    private int defaultNumOfProductionCards;

    public GameState(GameMap gameMap,
                     CardManager<BonusCard> bonusCardManager,
                     CardManager<ProductionCard> prodCardManager,
                     CardManager<EventCard> eventCardManager,
                     List<Emergency> emergencies,
                     List<VictoryCondition> victoryConditions,
                     List<LossCondition> lossConditions,
                     Repository repository,
                     int maxEmergencyLevel,
                     int defaultStrongholdCost,
                     int defaultNumOfProductionCards,
                     TurnSequence turns) {
        this.gameMap = gameMap;
        this.bonusCardManager = bonusCardManager;
        this.prodCardManager = prodCardManager;
        this.eventCardManager = eventCardManager;
        this.emergencies = emergencies;
        this.victoryConditions = victoryConditions;
        this.lossConditions = lossConditions;
        blockades = new ArrayList<Blockade>();
        numberOfProductionCards = defaultNumOfProductionCards;
        this.repository = repository;
        this.turns = turns;
        this.defaultStrongholdCost = defaultStrongholdCost;
        this.defaultNumOfProductionCards = defaultNumOfProductionCards;
        this.maxEmergencyLevel = maxEmergencyLevel;
        //Set the state of the game as active
        this.currentState = EndState.GAME_ACTIVE;
        //Set the stronghold cost to the default level
        this.currentStrongholdCost = defaultStrongholdCost;
    }

    /**
     * Returns the adjacent locations of the specified pawn
     * @param p
     * @return
     */
    public Set<Location> getAdjacentLocations(GamePawn p) {
        return gameMap.getAdjacentLocations(p);
    }

    public Set<Location> getAdjacentLocations(Location l) {
        return gameMap.getAdjacentLocations(l);
    }

    /**
     * Returns the location in which the specified pawn is located
     * @param p
     * @return
     */
    public Location getLocationInMap(GamePawn p) {
        return gameMap.getLocation(p);
    }

    /**
     * Adds a new transport pawn in the game. The pawn must have been added to the production group beforehand.
     * @param tp
     * @param l
     */
    public void addTransportPawn(TransportPawn tp, Location l) {
        if (gameMap.containsPawn(tp)) {
            //Check if we're trying to add a pawn that already exists
            throw new CannotMovePawnException("The pawn already exists");
        }
        //Check if we're trying to place a transport pawn into a location where another transport pawn resides
        if (isOccupiedByTransportPawn(l)) {
            throw new CannotMovePawnException("The pawn cannot be moved in this location.");
        }
        addPawn(tp, l);
    }

    /**
     * Moves a pawn to the specified location, if such pawn exists. For Transport Pawns checks if the location is
     * not already occupied by another transport pawn.
     * @param p
     * @param l
     */
    public void movePawn(GamePawn p, Location l) {
        if (p instanceof TransportPawn) {
            //Check if the location is not occupied by another transport pawn
            if (isOccupiedByTransportPawn(l)) {
                throw new CannotMovePawnException("The pawn cannot be moved in this location.");
            }
        }
        //Check if the pawn exists in the map
        if (!gameMap.containsPawn(p)) {
            throw new NoSuchPawnException("The pawn is not in the game");
        }
        gameMap.placePawn(p, l);
    }

    /**
     * Returns the number of transport pawns belonging to the specified production group
     * @param pg
     * @return
     */
    public int getTransportPawnsCount(ProductionGroup pg) {
        Set<GamePawn> pawns = gameMap.getAllPawns().keySet();
        int counter = 0;
        //For each pawn check if it is a transport pawn.
        //The counter is increased for each transport pawn belonging to the current production group.
        for(GamePawn pawn : pawns) {
            if (pawn instanceof TransportPawn) {
                ProductionGroup pg2 = ((TransportPawn) pawn).getProductionGroup();
                if (pg.equals(pg)) {
                    counter++;
                }
            }
        }
        return counter;
    }

    public void placeStronghold(Stronghold s) {
        Area strongholdArea = null;
        for(Area a : gameMap.getAreas()) {
            if (a.contains(s.getLocation())) {
                strongholdArea = a;
            }
        }
        //Add the stronghold to the area
        strongholdArea.addStrongHold(s);
        //Create the stronghold pawn
        StrongholdPawn sp = new StrongholdPawn(s);
        //Place the stronghold pawn in the location
        addPawn(sp, s.getLocation());
    }

    /**
     * Removes the pawn from the board
     * @param p
     */
    public void removePawn(GamePawn p) {
        if (p instanceof TransportPawn) {
            ((TransportPawn) p).getProductionGroup().removeTransportPawn((TransportPawn) p);
        }
        gameMap.removePawn(p);
        repository.deleteFromRepository(p.getObjectID());
    }

    /**
     * Returns a list of all the locations contained in the map
     * @return
     */
    public Set<Location> getMapLocations() {
        return gameMap.getAllLocations();
    }

    /**
     * Checks if the specified pawn is currently placed in the map
     * @param p
     * @return
     */
    public boolean mapContainsPawn(GamePawn p) {
        return gameMap.containsPawn(p);
    }

    /**
     * Returns all the pawns on the specified location
     * @param l
     * @return
     */
    public Set<GamePawn> getPawnsOnLocation(Location l) {
        return gameMap.getPawnsOnLocation(l);
    }

    /**
     * Activates the diffusion procedure for the selected emergency, with the specified starting locations and the
     * specified level increase for each location.
     * @param e
     * @param startLocations
     */
    public void diffuseEmergency(Emergency e, Map<Location, Integer> startLocations) {
        //Reset the list of diffused locations
        lastDiffusedLocations = new ArrayList<Location>();
        List<Location> toDiffuse = new ArrayList<Location>();
        //Contains the locations where the emergency has already been diffused
        List<Location> diffused = new ArrayList<Location>();

        //Copy the content of the startLocations list
        for(Location l : startLocations.keySet()) {
            toDiffuse.add(l);
        }

        while (!toDiffuse.isEmpty()) {
            Location l = toDiffuse.get(0);
            //Check if the location is not quarantined and has not been diffused yet
            if (!l.isQuarantined() && !diffused.contains(l)) {
                int emergencyLevel = l.getEmergencyLevel(e);
                //Increase the emergency level by the specified amount (or 1 if not a starting location
                int increase = 1;
                if (startLocations.containsKey(l)) {
                    increase = startLocations.get(l);
                }
                l.setEmergencyLevel(e, emergencyLevel + increase);
                if (l.getEmergencyLevel(e) > maxEmergencyLevel) {
                    //Set to the maximum level, in case it is greater than that
                    l.setEmergencyLevel(e, maxEmergencyLevel);
                    Set<Location> adjacentLocations = gameMap.getAdjacentLocations(l);
                    for (Location l2 : adjacentLocations) {
                        //Add to the diffusion queue if not present in the diffused list
                        toDiffuse.add(l2);
                    }
                }
                diffused.add(l);
            }
            toDiffuse.remove(l);
        }
        lastDiffusedLocations = diffused;
    }

    /**
     * Returns the list of locations where the last emergency has been diffused.
     * @return
     */
    public List<Location> getLastDiffusedLocations() {
        return lastDiffusedLocations;
    }

    /**
     * Returns the General Hazard Indicator level for the specified emergency
     * @param e
     * @return
     */
    public int getGeneralHazardIndicatorLevel(Emergency e) {
        return e.getGeneralHazardIndicator().getCurrentLevel();
    }

    /**
     * Increases the General Hazard Indicator level for the specified emergency
     * @param e
     */
    public void raiseGeneralHazardIndicatorLevel(Emergency e) {
        e.getGeneralHazardIndicator().raiseHazardLevel();
    }

    /**
     * Returns a list of randomly selected bonus cards
     * @param n
     * @return
     */
    public List<BonusCard> getBonusCards(int n) {
        return bonusCardManager.getCards(n);
    }

    /**
     * Returns a list of randomly selected event cards
     * @param n
     * @return
     */
    public List<EventCard> getEventCards(int n) {
        return eventCardManager.getCards(n);
    }

    /**
     * Returns a list of randomly selected production cards. Only locations without a transport pawn will be selected.
     * Because of this, if there are not enough cards that fit the criteria less than n cards will be extracted
     * (including zero).
     * @param n
     * @return
     */
    public List<ProductionCard> getProductionCards(int n) {
        List<Location> occupiedLocations = new ArrayList<>();
        Map<GamePawn, Location> pawns = gameMap.getAllPawns();
        //Add to the list all the locations that are occupied by a transport pawn
        for (Map.Entry<GamePawn, Location> entry : pawns.entrySet()) {
            if (entry.getKey() instanceof TransportPawn) {
                occupiedLocations.add(entry.getValue());
            }
        }
        return prodCardManager.getProductionCards(occupiedLocations, n);
    }

    /**
     * Reduces the specified emergency in the specified locations. If there is a stronghold in the same
     * area as the location, then the level of the emergency is set to 0. Otherwise, it will be reduced by 1.
     * @param e
     * @param l
     */
    public void solveEmergency(Emergency e, Location l) {
        int decrease = 1;
        Area a = gameMap.getAreaByLocation(l);
        List<Stronghold> strongholds = a.getStrongholds();
        for (Stronghold s : strongholds) {
            if (s.getEmergency().equals(e)) {
                //If the stronghold for the emergency exists in the area, decrease the emergency level to 0
                decrease = l.getEmergencyLevel(e);
            }
        }
        int currentLevel = l.getEmergencyLevel(e);
        l.setEmergencyLevel(e, currentLevel - decrease);
    }

    /**
     * Blocks one path in the map by putting a blockade between the specified locations.
     * @param l1
     * @param l2
     */
    public void block(Location l1, Location l2) {
        //Check if there is already a blockade
        for (Blockade b: blockades) {
            if (b.contains(l1, l2)) {
                throw new CannotCreateBlockadeException("A blockade is already present.");
            }
        }
        //Check if locations are adjacent
        Set<Location> locations = gameMap.getAdjacentLocations(l1);
        if (locations.contains(l2)) {
            //If so, create the blockade
            Blockade b = new Blockade(l1, l2);
            gameMap.removePath(l1, l2);
            blockades.add(b);
        } else {
            throw new CannotCreateBlockadeException("Locations must be adjacent");
        }
    }

    /**
     * Checks whether there is a blockade between the specified locations
     * @param l1
     * @param l2
     * @return
     */
    public boolean isBlocked(Location l1, Location l2) {
        try {
            findBlockade(l1, l2);
        } catch(NoSuchBlockadeException e) {
            return false;
        }
        return true;
    }

    /**
     * Removes a previously placed blockade between two locations. Throws an exception if there is no
     * blockade between them.
     * @param l1
     * @param l2
     */
    public void unblock(Location l1, Location l2) {
        Blockade b = findBlockade(l1, l2);
        gameMap.addPath(l1, l2);
        blockades.remove(b);
    }

    /**
     * Returns a map of all the pawns currently in the map, each with the relative location
     * @return
     */
    public Map<GamePawn, Location> getAllPawns() {
        return gameMap.getAllPawns();
    }

    public void setNumberOfProductionCards(int number) {
        numberOfProductionCards = number;
    }

    public int getNumberOfProductionCards() {
        return numberOfProductionCards;
    }

    /**
     * Returns all the areas in the game map.
     * @return
     */
    public List<Area> getAreas() {
        return gameMap.getAreas();
    }

    /**
     * Returns all the emergencies in the game
     * @return
     */
    public List<Emergency> getEmergencies() {
        return emergencies;
    }

    /**
     * Evaluates all the end conditions, and sets the end state of the game accorindgly to them.
     * This method is to be called after each turn.
     */
    public void evaluateEndConditions() {
        //Check the victory conditions
        for (VictoryCondition v : victoryConditions) {
            if (v.evaluateEndCondition(this)) {
                currentState = EndState.GAME_VICTORY;
                return;
            }
        }

        //Check the loss conditions
        for (LossCondition l : lossConditions) {
            if (l.evaluateEndCondition(this)) {
                currentState = EndState.GAME_LOSS;
                return;
            }
        }
    }

    public EndState getCurrentState() {
        return currentState;
    }

    /**
     * Withdraws the resources contained in the specified transport pawn. Only the resources whose type is specified in
     * the reqResources list will be withdrawn. The action group pawn is requested to check if the resources can be
     * withdrawn
     * @param reqResources
     * @param ap
     * @param tp
     * @return
     */
    public Provisions takeResources(List<Resource> reqResources, ActionPawn ap, TransportPawn tp) {
        if (!gameMap.getLocation(ap).equals(gameMap.getLocation(tp))) {
            throw new CannotTakeResourcesException("The action pawn is not in the same location as the transport pawn.");
        }
        Provisions result = new Provisions();
        Provisions p = tp.getPayload();
        for (Resource r : p.getListResources()) {
            if (reqResources.contains(r)) {
                int quantity = p.withdrawResource(r);
                result.addResource(r, quantity);
            }
        }
        //Check if the transport pawn is empty
        if (tp.getPayload().isEmpty()) {
            //Remove from the map
            removePawn(tp);
        }
        return result;
    }

    /**
     * Returns the contagion ratio of the specified emergency, i.e. the percentage of locations with maximum level of
     * emergency.
     * @param e
     * @return
     */
    public double getContagionRatio(Emergency e) {
        int counter = 0;
        Set<Location> locations = gameMap.getAllLocations();

        for(Location l : locations) {
            if (l.getEmergencyLevel(e) >= maxEmergencyLevel) {
                counter++;
            }
        }

        return ((double) counter) / locations.size();
    }

    /**
     * Returns the maximum emergency level.
     * @return
     */
    public int getMaxEmergencyLevel() {
        return maxEmergencyLevel;
    }

    /**
     * Returns the object repository
     * @return
     */
    public Repository getRepository() {
        return repository;
    }

    /**
     * Returns the current cost for building a stronghold
     * @return
     */
    public int getCurrentStrongholdCost() {
        return currentStrongholdCost;
    }

    /**
     * Sets the cost for building a stronghold
     * @param cost
     */
    public void setCurrentStrongholdCost(int cost) {
        currentStrongholdCost = cost;
    }

    /**
     * Returns the default cost for building a stronghold
     * @return
     */
    public int getDefaultStrongholdCost() {
        return defaultStrongholdCost;
    }

    /**
     * Returns the default number of production cards that can be selected by Production Groups.
     * @return
     */
    public int getDefaultNumOfProductionCards() {
        return defaultNumOfProductionCards;
    }

    /**
     * Returns an object that contains the turns in the game.
     * @return
     */
    public TurnSequence getTurns() {
        return turns;
    }

    /**
     * Returns a Json object containing the game state
     * @return
     */
    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(GameState.class, new GameStateSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }


    /*Private Methods*/

    private Blockade findBlockade(Location l1, Location l2) {
        int i = 0;
        boolean found = false;
        while (i < blockades.size() && !found) {
            if (blockades.get(i).contains(l1, l2)) {
                return blockades.get(i);
            } else {
                i++;
            }
        }

        if (!found) {
            throw new NoSuchBlockadeException("There is no blockade between the two locations.");
        }
        return null;
    }

    private void addPawn(GamePawn p, Location l) {
        gameMap.placePawn(p,l);
        repository.insertInRepository(p.getObjectID(), p);
    }

    public boolean isOccupiedByTransportPawn(Location l) {
        Set<GamePawn> pawnsOnLocation = gameMap.getPawnsOnLocation(l);
        for (GamePawn p : pawnsOnLocation) {
            if (p instanceof TransportPawn) {
                return true;
            }
        }
        return false;
    }

    public class GameStateSerializer implements JsonSerializer<GameState> {

        @Override
        public JsonElement serialize(GameState gameState, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("currentState", currentState.toString());
            result.add("gameMap", gameMap.toJson());
            JsonArray blockJson = new JsonArray();
            for (Blockade b : blockades) {
                blockJson.add(b.toJson());
            }
            result.add("blockades", blockJson);
            JsonArray emergencyJson = new JsonArray();
            JsonArray contagionRatiosJson = new JsonArray();
            for (Emergency e : emergencies) {
                emergencyJson.add(e.toJson());
                JsonObject contagionJson = new JsonObject();
                contagionJson.addProperty("emergency", e.getNameEmergency());
                contagionJson.addProperty("contagionRatio", getContagionRatio(e));
                contagionRatiosJson.add(contagionJson);
            }
            result.add("emergencies", emergencyJson);
            result.addProperty("maxEmergencyLevel", maxEmergencyLevel);
            result.addProperty("numOfProductionCards", numberOfProductionCards);
            result.addProperty("currentStrongholdCost", currentStrongholdCost);
            result.add("contagionRatios", contagionRatiosJson);
            return result;
        }
    }
}