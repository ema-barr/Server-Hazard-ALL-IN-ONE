package it.uniba.hazard.engine.main;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.GamePawn;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.turn.ProductionTurn;
import it.uniba.hazard.engine.util.response.*;

import java.util.*;

/**
 * The GameController class handles the requests coming from the server, routes them to the appropriate classes
 * and builds the response that will be sent back.
 */
public class GameController {
    public Response request(JsonElement reqData, Game game) {
        Response resp = null;
        JsonObject reqDataJ = reqData.getAsJsonObject();
        String requestName = reqDataJ.get("requestName").getAsString();
        Turn currentTurn;
        String[] params;
        switch (requestName) {
            case "nextTurn": {
                resp = game.nextTurn();
                break;
            }
            case "getState": {
                resp = new GenericResponse(game.toJson());
                break;
            }
            case "moveActionPawn":
            {
                currentTurn = game.getTurns().getCurrentTurn();
                params = new String[2];
                params[0] = "moveActionPawn";
                params[1] = reqDataJ.get("targetDestination").getAsString();
                resp = ((ActionTurn) currentTurn).runCommand(game.getState(), params);
                break;
            }
            case "solveEmergency": {
                currentTurn = game.getTurns().getCurrentTurn();
                params = new String[2];
                params[0] = "solveEmergency";
                params[1] = reqDataJ.get("emergencyID").getAsString();
                resp = ((ActionTurn) currentTurn).runCommand(game.getState(), params);
                break;
            }
            case "takeResources": {
                currentTurn = game.getTurns().getCurrentTurn();
                params = new String[2];
                params[0] = "takeResources";
                params[1] = reqDataJ.get("pawnID").getAsString();
                resp = ((ActionTurn) currentTurn).runCommand(game.getState(), params);
                break;
            }
            case "useBonusCard": {
                currentTurn = game.getTurns().getCurrentTurn();
                params = new String[2];
                params[0] = "useBonusCard";
                params[1] = reqDataJ.get("cardIndex").getAsString();
                resp = ((ActionTurn) currentTurn).runCommand(game.getState(), params);
                break;
            }
            case "buildStronghold": {
                currentTurn = game.getTurns().getCurrentTurn();
                params = new String[3];
                params[0] = "buildStronghold";
                params[1] = reqDataJ.get("emergencyID").getAsString();
                params[2] = reqDataJ.get("locationID").getAsString();
                resp = ((ActionTurn) currentTurn).runCommand(game.getState(), params);
                break;
            }
            case "getCurrentTurn": {
                currentTurn = game.getTurns().getCurrentTurn();
                if (currentTurn instanceof ActionTurn) {
                    ActionPawn pawn = ((ActionTurn) currentTurn).getPlayer().getActionPawn();
                    Location pawnLocation = game.getState().getLocationInMap(pawn);
                    resp = new GetCurrentTurnResponse((ActionTurn) currentTurn, pawn, pawnLocation);
                } else if (currentTurn instanceof ProductionTurn) {
                    List<TransportPawn> pawns = ((ProductionTurn) currentTurn).getPlayer().getTransportPawns();
                    Map<TransportPawn, Location> pawnLocationMap = new HashMap<TransportPawn, Location>();
                    for(TransportPawn tp : pawns) {
                        pawnLocationMap.put(tp, game.getState().getLocationInMap(tp));
                    }
                    resp = new GetCurrentTurnResponse((ProductionTurn) currentTurn, pawnLocationMap);
                } else {
                    resp = new GenericResponse(currentTurn.toJson());
                }
                break;
            }
            case "getAdjacentLocations": {
                String locationID = reqDataJ.get("locationID").getAsString();
                Location l = (Location) Repository.getFromRepository(locationID);
                Set<Location> adjLocations = game.getState().getAdjacentLocations(l);
                resp = new AdjacentLocationsResponse(adjLocations);
                break;
            }
            case "getEmergencies": {
                String locationID = reqDataJ.get("locationID").getAsString();
                Location l = (Location) Repository.getFromRepository(locationID);
                List<Area> areas = game.getState().getAreas();
                Area locArea = null;
                for(Area a : areas) {
                    if (a.contains(l)) locArea = a;
                }
                resp = new EmergenciesResponse(l, locArea);
                break;
            }
            case "getTransports": {
                String locationID = reqDataJ.get("locationID").getAsString();
                Location l = (Location) Repository.getFromRepository(locationID);
                Set<GamePawn> pawns = game.getState().getPawnsOnLocation(l);
                List<TransportPawn> transportPawns = new ArrayList<>();
                for (GamePawn p : pawns) {
                    if (p instanceof TransportPawn) transportPawns.add((TransportPawn) p);
                }
                ActionGroup ag = ((ActionTurn) game.getTurns().getCurrentTurn()).getPlayer();
                resp = new GetTransportsResponse(transportPawns, ag);
                break;
            }
            case "getStrongholdInfo": {
                String locationID = reqDataJ.get("locationID").getAsString();
                Location l = (Location) Repository.getFromRepository(locationID);
                List<Area> areas = game.getState().getAreas();
                Area locArea = null;
                for(Area a : areas) {
                    if (a.contains(l)) locArea = a;
                }
                List<Stronghold> strongholds = locArea.getStrongholds();
                List<StrongholdInfo> strongholdInfos = new ArrayList<>();
                for (Emergency e : game.getState().getEmergencies()) {
                    strongholdInfos.add((StrongholdInfo) Repository.getFromRepository("StrongholdInfo_" + e.getNameEmergency()));
                }
                resp = new GetStrongholdInfoResponse(game.getState().getEmergencies(),
                        strongholds, game.getState().getCurrentStrongholdCost(), strongholdInfos);
                break;
            }
            case "moveTransportPawn": {
                String locationID = reqDataJ.get("destinationID").getAsString();
                String pawnID = reqDataJ.get("pawnID").getAsString();
                params = new String[3];
                params[0] = "movePawn";
                params[1] = pawnID;
                params[2] = locationID;
                ProductionTurn turn = (ProductionTurn) game.getTurns().getCurrentTurn();
                resp = turn.runCommand(game.getState(), params);
                break;
            }
            case "chooseProductionCard": {
                String cardIndex = reqDataJ.get("cardIndex").getAsString();
                params = new String[2];
                params[0] = "chooseCard";
                params[1] = cardIndex;
                ProductionTurn turn = (ProductionTurn) game.getTurns().getCurrentTurn();
                resp = turn.runCommand(game.getState(), params);
            }
        }
        return resp;
    }
}
