package it.uniba.hazard.engine.main;


import it.uniba.hazard.engine.cards.*;
import it.uniba.hazard.engine.endgame.LossCondition;
import it.uniba.hazard.engine.endgame.VictoryCondition;
import it.uniba.hazard.engine.exception.InsufficientNumOfLocationsException;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.GameMap;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.map.MapGraph;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.turn.EmergencyTurn;
import it.uniba.hazard.engine.turn.EventTurn;
import it.uniba.hazard.engine.turn.ProductionTurn;
import it.uniba.hazard.engine.util.xml_reader.*;
import org.jgrapht.UndirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.SimpleGraph;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.text.MessageFormat;
import java.util.*;

public class GameInitialization {
    private GameState gs;
    private Game game;
    private String pathXML;
    private Repository repository;

    public GameInitialization(String pathXML){
        HashMap<String, Object> rep = new HashMap<String, Object>();
        repository = new Repository(rep);
        this.pathXML = pathXML;
    }

    public void initialization(){
        //Language
        Locale currentLocale = LanguageReader.readLanguage(pathXML);


        File file = new File("./resources");
        URL[] urls = new URL[0];
        try {
            urls = new URL[]{file.toURI().toURL()};
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        ClassLoader loader = new URLClassLoader(urls);

        ResourceBundle messages = ResourceBundle.getBundle("MessageBundle",
                currentLocale, loader);

        MessageFormat formatter = new MessageFormat("");
        formatter.setLocale(currentLocale);
        Repository.insertInRepository("resourceBundle", messages);
        Repository.insertInRepository("messageFormat", formatter);

        System.out.println(messages.getString("InitializationStart"));
        System.out.println(messages.getString("InitializationLanguage"));

        //Resources
        ArrayList<Resource> resourcesList = (ArrayList<Resource>) ResourceReader.readResources(pathXML);
        for(Resource res: resourcesList){
            Repository.insertInRepository(res.getObjectID(), res);
        }
        System.out.println(messages.getString("InitializationResources"));

        //Emergencies
        ArrayList<Emergency> emergenciesList = (ArrayList<Emergency>) EmergencyReader.readEmergencies(pathXML);
        for (Emergency em: emergenciesList){
            Repository.insertInRepository(em.getObjectID(), em);
        }
        Repository.insertInRepository("emergenciesList", emergenciesList);

        int strongholdCost = EmergencyReader.readMaxGravityLevel(pathXML);
        int maxGravityLevel = EmergencyReader.readMaxGravityLevel(pathXML);

        System.out.println(messages.getString("InitializationEmergencies"));

        //StrongholdInfos
        ArrayList<StrongholdInfo> strongholdInfosList = (ArrayList<StrongholdInfo>) StrongholdInfosReader.readStrongholdInfos(pathXML);
        for (StrongholdInfo strInfo: strongholdInfosList){
            Repository.insertInRepository("StrongholdInfo_" + strInfo.getEmergency().getNameEmergency(), strInfo);
        }

        System.out.println(messages.getString("InitializationStrongholdInfos"));

        //Map
        ArrayList<Location> locationsList = (ArrayList<Location>) MapReader.readLocations(pathXML);
        for (Location loc: locationsList){
            Repository.insertInRepository(loc.getObjectID(), loc);
        }
        Repository.insertInRepository("locationsList", locationsList);

        MapGraph graph = createGraph();

        ArrayList<Area> areasList = (ArrayList<Area>) MapReader.readAreas(pathXML);
        System.out.println(messages.getString("InitializationMap"));

        //Groups
        ArrayList<ActionGroup> actionGroupsList = (ArrayList<ActionGroup>) GroupReader.readActionGrooups(pathXML);
        Repository.insertInRepository("actionGroupsList", actionGroupsList);
        for (ActionGroup ag: actionGroupsList){
            Repository.insertInRepository(ag.getObjectID(), ag);
        }

        ArrayList<ProductionGroup> productionGroupsList = (ArrayList<ProductionGroup>) GroupReader.readProductionGrooups(pathXML);
        Repository.insertInRepository("productionGroupsList", productionGroupsList);
        for (ProductionGroup pg: productionGroupsList){
            Repository.insertInRepository(pg.getObjectID(), pg);
        }

        System.out.println(messages.getString("InitializationGroups"));

        //Cards
        CardManager<BonusCard> bonusCardManager = new CardManager<BonusCard>();
        List<List<Card>> bonusCardsMap = XmlCardsReader.readBonusCards(pathXML);
        /*Set<String> bonusCardMapKeys = bonusCardsMap.keySet();
        for (String str: bonusCardMapKeys){
            int quantity = bonusCardsMap.get(str);
            bonusCardManager.instanceCard(str, quantity);
        }*/
        for (List<Card> list :  bonusCardsMap) {
            bonusCardManager.instanceCardsNew(list);
        }

        CardManager<EventCard> eventCardManager = new CardManager<EventCard>();
        List<List<Card>> eventCardsMap = XmlCardsReader.readEventCards(pathXML);
        for (List<Card> list :  eventCardsMap) {
            eventCardManager.instanceCardsNew(list);
        }

        CardManager<ProductionCard> productionCardManager = new CardManager<ProductionCard>();
        List<List<Card>> prodCardMap = XmlCardsReader.readProductionCards(pathXML);
        for (List<Card> list :  prodCardMap) {
            productionCardManager.instanceCardsNew(list);
        }

        System.out.println(messages.getString("InitializationCards"));

        //Turns
        TurnReader.createTurnOrder(pathXML);
        ArrayList<EmergencyTurn> emergencyTurnsList = (ArrayList<EmergencyTurn>) TurnReader.readEmergencyTurns(pathXML);
        ArrayList<ActionTurn> actionTurnsList = (ArrayList<ActionTurn>) TurnReader.readActionTurns(pathXML);
        ArrayList<ProductionTurn> productionTurnsList = (ArrayList<ProductionTurn>) TurnReader.readProductionTurns(pathXML);
        ArrayList<EventTurn> eventTurnsList = (ArrayList<EventTurn>) TurnReader.readEventTurns(pathXML);
        ArrayList<Turn> turnOrder = (ArrayList<Turn>) TurnReader.readTurnOrder(pathXML);
        int numOfProductionCards = TurnReader.readNumOfProductionCards(pathXML);
        TurnSequence ts = new TurnSequence(turnOrder);
        Repository.insertInRepository("turn_order", ts);

        System.out.println(messages.getString("InitializationTurns"));

        //EndGame
        ArrayList<VictoryCondition> victoryConditionsList = (ArrayList<VictoryCondition>)
        EndGameReader.readVictoryConditions(pathXML);
        ArrayList<LossCondition> lossConditionsList = (ArrayList<LossCondition>) EndGameReader.readLossConditions(pathXML);

        System.out.println(messages.getString("InitializationEndGameConditions"));

        //Creazione del gamestate
        GameMap gm = new GameMap(graph, areasList);
        gs = new GameState(gm, bonusCardManager, productionCardManager, eventCardManager, emergenciesList,
                victoryConditionsList, lossConditionsList, repository, maxGravityLevel, strongholdCost,
                numOfProductionCards,ts);
        game = new Game(gs, ts);

        //Assign action pawns to each action group
        for (ActionGroup ag: actionGroupsList){
            ActionPawn ap = ag.assignActionPawn();
            gm.placePawn(ap, ag.getStartingPoint());
        }

        //Setup
        System.out.println(messages.getString("InitializationSetupStart"));
        Map<Emergency, Map<Integer, Integer>> setup = SetupReader.readSetup(pathXML);
        doSetup(setup);

        System.out.println(messages.getString("InitializationSetupEnd"));

        game.nextTurn();
        System.out.println(messages.getString("InitializationEnd"));
    }

    public Game getGame() {
        return game;
    }

    public GameState getGameState() {
        return gs;
    }

    /**
     * Initial setup
     * @param settings
     */
    public void doSetup(Map<Emergency, Map<Integer, Integer>> settings){
        Set<Emergency> emergenciesKeyset = settings.keySet();
        int numLocations;
        Random random = new Random();
        int randomIndexLoc;
        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");
        for (Emergency emergency: emergenciesKeyset){
            ArrayList<Location> locationsList = new ArrayList<Location>((ArrayList<Location>) Repository.getFromRepository("locationsList"));
            Map<Integer, Integer>  setup = settings.get(emergency);

            Set<Integer> setupKeyset = setup.keySet();
            int value;

            //the number of locations where the emergency start must be lower than the number of possible locations
            boolean check = checkNumLocations(locationsList, setup);

            if (check){
                for (int key: setupKeyset){
                    value = setup.get(key);
                    HashMap<Location, Integer> locationsStart = new HashMap<Location,Integer>();

                    for (int i = 0; i < value; i++){
                        numLocations = locationsList.size();
                        randomIndexLoc = random.nextInt(numLocations);

                        Location l = locationsList.get(randomIndexLoc);
                        locationsStart.put(l, value);

                        locationsList.remove(randomIndexLoc);
                    }
                    gs.diffuseEmergency(emergency, locationsStart);
                }


            } else {
                throw new InsufficientNumOfLocationsException("The number of location where emergency " +
                        emergency.getNameEmergency() + " starts is greater than the number of possible locations");
            }
            Object[] messageArgs = {emergency.getNameEmergency()};
            formatter.applyPattern(messages.getString("InitializationSetupEmergency"));

            System.out.println(formatter.format(messageArgs));
        }



    }

    private boolean checkNumLocations(List<Location> locationList, Map<Integer, Integer> setup){
        int numLocations = locationList.size();
        int numLocationsSett = 0;

        Set<Integer> keys = setup.keySet();

        for (int key: keys){
            numLocationsSett = numLocationsSett + setup.get(key);
        }

        if (numLocations < numLocationsSett){
            return false;
        } else {
            return true;
        }
    }

    private MapGraph createGraph(){
        MapGraph graph = new MapGraph();
        ArrayList<Location> locationsList = (ArrayList<Location>) Repository.getFromRepository("locationsList");
        for (Location loc: locationsList){
            graph.addVertex(loc);
        }
        graph.addEdge(locationsList.get(0), locationsList.get(1));
        HashMap<Location, List<Location>> neighborMap = (HashMap<Location, List<Location>>) MapReader.readNeighbors(pathXML);
        Set<Location> locationKeyset = neighborMap.keySet();
        for (Location loc: locationKeyset){
            ArrayList<Location> neighborsList = (ArrayList<Location>) neighborMap.get(loc);
            for (Location neigh: neighborsList){
                graph.addEdge(loc, neigh);
            }
        }
        return graph;
    }

}
