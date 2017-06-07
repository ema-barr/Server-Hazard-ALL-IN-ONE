package it.uniba.hazard.engine.groups;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.CannotTakeResourcesException;
import it.uniba.hazard.engine.exception.EmergencyMismatchException;
import it.uniba.hazard.engine.exception.InsufficientResourcesException;
import it.uniba.hazard.engine.exception.StrongholdAlreadyPresentException;
import it.uniba.hazard.engine.main.*;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.TransportPawn;
import it.uniba.hazard.engine.util.response.action_group.ActionGroupMoveResponse;
import it.uniba.hazard.engine.util.response.action_group.BuildStrongholdResponse;
import it.uniba.hazard.engine.util.response.action_group.SolveEmergencyResponse;
import it.uniba.hazard.engine.util.response.action_group.TakeResourceResponse;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Set;
import java.util.logging.Level;

public class ActionGroup {
    private final static java.util.logging.Logger LOGGER = java.util.logging.Logger.getLogger(ActionGroup.class.getName());
    private String objectID;
    private List<Emergency> emergencyToBeSolved;
    private List<Resource> usedRes;
    private Provisions provisions;
    private ActionPawn actionPawn;
    private String nameActionGroup;
    private List<Location> HQs;
    private Location startingPoint;

    public ActionGroup(List<Emergency> emergencyToBeSolved, List<Resource> usedRes, Provisions provisions,
                       String nameActionGroup, List<Location> HQs, Location startingPoint) {
        this.objectID = this.getClass().getName() + "_" + nameActionGroup;
        this.emergencyToBeSolved = emergencyToBeSolved;
        this.usedRes = usedRes;
        if (provisions == null){
            this.provisions = new Provisions();
        } else {
            this.provisions = provisions;
        }
        //this.actionPawn = assignActionPawn();
        this.nameActionGroup = nameActionGroup;
        this.HQs = HQs;
        this.startingPoint = startingPoint;
    }

    public ActionPawn assignActionPawn() {
        this.actionPawn = new ActionPawn(this);
        return actionPawn;
    }

    public String getObjectID() {
        return objectID;
    }

    public List<Emergency> getEmergencyToBeSolved() {
        return emergencyToBeSolved;
    }

    public List<Resource> getUsedRes() {
        return usedRes;
    }

    public Provisions getProvisions() {
        return provisions;
    }

    public void setProvisions(Provisions provisions) {
        this.provisions = provisions.clone();
    }

    public ActionPawn getActionPawn() {
        return actionPawn;
    }

    public String getNameActionGroup() {
        return nameActionGroup;
    }

    public TakeResourceResponse takeResources(GameState state, TransportPawn tp) {
        LOGGER.log(Level.INFO, "Called ActionGroup.takeResources");
        TakeResourceResponse takeResourceResponse;

        try {
            Provisions prov = state.takeResources(usedRes, actionPawn, tp);
            //TODO è il gamestate che dice se le risorse sono state prese o no?
            LOGGER.log(Level.INFO, "Resources taken from the TransportPawn are: " + prov.getListResources().toString());
            for (Resource r : prov.getListResources()) {
                provisions.addResource(r, prov.getQuantity(r));
            }

            takeResourceResponse = new TakeResourceResponse(true, tp, this);
        } catch (CannotTakeResourcesException e) {
            takeResourceResponse = new TakeResourceResponse(false, tp, this);
        }

        return takeResourceResponse;
    }

    public List<Location> getHQs() {
        return HQs;
    }

    public Location getStartingPoint() {
        return startingPoint;
    }

    public SolveEmergencyResponse solveEmergency(GameState state, Emergency toSolve) {
        LOGGER.log(Level.INFO, "Called ActionGroup.solveEmergency");
        LOGGER.log(Level.INFO, "ActionPawn currently is in " + state.getLocationInMap(actionPawn));
        SolveEmergencyResponse solveEmergencyResponse;

        //Check if the emergency can be solved by this group
        if (!emergencyToBeSolved.contains(toSolve)) {
            //throw new EmergencyMismatchException("This emergency cannot be solved by this group.");
            LOGGER.log(Level.SEVERE, "Trying to solve an emergency not managed by the current ActionGroup. This should not happen");
            solveEmergencyResponse = new SolveEmergencyResponse(false, toSolve, this,
                    new EmergencyMismatchException("This emergency cannot be solved by this group."));
        }
        //Check if there is sufficient resources to solve the emergency
        Resource res = toSolve.getResourceNeeded();
        int resQuantity = provisions.getQuantity(res);
        LOGGER.log(Level.INFO, "Resource needed is " + res.getObjectID() + ", ActionGroup currently has " + provisions.getQuantity(res));
        if (resQuantity <= 0) {
            LOGGER.log(Level.INFO, "Cannot solve the emergency, not enough resources");
            //throw new InsufficientResourcesException("Not enough resources to execute the requested action.");
            solveEmergencyResponse = new SolveEmergencyResponse(false, toSolve, this,
                    new InsufficientResourcesException("Not enough resources to execute the requested action."));
        } else {
            LOGGER.log(Level.INFO, "Level of " + toSolve.getObjectID() + " in " + state.getLocationInMap(actionPawn).getObjectID() + "is " + state.getLocationInMap(actionPawn).getEmergencyLevel(toSolve));
            //Check if the emergency has a level greater than zero
            if (state.getLocationInMap(actionPawn).getEmergencyLevel(toSolve) > 0) {
                //If it is, then withdraw the resources and solve the emergency
                LOGGER.log(Level.INFO, "The emergency has a level greater than zero. Solving...");
                provisions.withdrawResource(res);
                provisions.addResource(res, resQuantity - 1);
                LOGGER.log(Level.INFO, "The ActionGroup now has " + provisions.getQuantity(res) + " " + res.getObjectID());
                solveEmergencyResponse = new SolveEmergencyResponse(true, toSolve, this);
                state.solveEmergency(toSolve, state.getLocationInMap(actionPawn));
            } else {
                //Otherwise, send an error response
                LOGGER.log(Level.INFO, "Cannot solve the emergency, its level is 0!");
                solveEmergencyResponse = new SolveEmergencyResponse(false, toSolve, this);
            }
        }
        return solveEmergencyResponse;
    }

    public BuildStrongholdResponse buildStronghold(GameState state, Emergency e, Location l) {
        LOGGER.log(Level.INFO, "Called ActionGroup.buildStronghold");
        BuildStrongholdResponse buildStrongholdResponse;

        StrongholdInfo si = (StrongholdInfo) state.getRepository().getFromRepository("StrongholdInfo_" + e.getNameEmergency());
        //Check if the emergency can be solved by this group
        if (!emergencyToBeSolved.contains(e)) {
            //throw new EmergencyMismatchException("This emergency cannot be solved by this group.");
            LOGGER.log(Level.SEVERE, "Trying to build a stronghold for an emergency not managed by the Action Group! This should not happen");
            buildStrongholdResponse = new BuildStrongholdResponse(false, this, e , l, si);
        }
        //Check if there is sufficient resources to solve the emergency
        Resource res = si.getResourceNeeded();
        int resQuantity = provisions.getQuantity(res);
        LOGGER.log(Level.INFO, "ActionGroup needs " + state.getCurrentStrongholdCost() + " " + res.getObjectID() + " to build the stronghold");
        if (resQuantity - state.getCurrentStrongholdCost() < 0) {
            //throw new InsufficientResourcesException("Not enough resources to execute the requested action.");
            LOGGER.log(Level.INFO, "ActionGroup cannot build the stronghold. Not enough resources");
            buildStrongholdResponse = new BuildStrongholdResponse(false, this, e , l, si,
                    new InsufficientResourcesException("Not enough resources to build the stronghold."));
        } else {
            //If there is, withdraw the resources from the group's deposit
            LOGGER.log(Level.INFO, "Trying to build the stronghold...");
            Stronghold s = new Stronghold(l, si);
            try {
                state.placeStronghold(s);
                LOGGER.log(Level.INFO, "Stronghold built successfully");

                //Withdraw the resources after the stronghold has been built
                provisions.withdrawResource(res);
                provisions.addResource(res, resQuantity - state.getCurrentStrongholdCost());
                LOGGER.log(Level.INFO, "Now the ActionGroup has " + provisions.getQuantity(res) + " " + res.getObjectID());

                buildStrongholdResponse = new BuildStrongholdResponse(true, this, e , l, si);
            } catch (StrongholdAlreadyPresentException ex) {
                LOGGER.log(Level.INFO, "Cannot build the stronghold, there is already a stronghold for the same emergency in the same area.");
                buildStrongholdResponse = new BuildStrongholdResponse(false, this, e, l, si, ex);
            }
        }
        return buildStrongholdResponse;
    }

    /**
     *     Moves the action group in a new destination.
     *     This method checks if the destination is adjacent to the current location of the group, so it should only
     *     be used for the standard movement action, not for bonus cards.
     *
     */

    public ActionGroupMoveResponse moveActionPawn(GameState state, Location l) {
        LOGGER.log(Level.INFO, "Called ActionGroup.moveActionPawn");
        LOGGER.log(Level.INFO, "The Action Group's pawn's current position is " + state.getLocationInMap(actionPawn).getObjectID());
        ActionGroupMoveResponse actionGroupMoveResponse;

        Set<Location> adjacentLocations = state.getAdjacentLocations(actionPawn);
        boolean found = false;
        for (Location adjLoc: adjacentLocations){
            if (adjLoc.toString().equals(l.toString())){
                found = true;
                break;
            }
        }
        if (found){
            LOGGER.log(Level.INFO, "Destination is adjacent, moving the pawn...");
            state.movePawn(actionPawn, l);
            actionGroupMoveResponse = new ActionGroupMoveResponse(true, l, this);
        } else {
            LOGGER.log(Level.INFO, "Destination is not adjacent. Cannot move the pawn");
            actionGroupMoveResponse = new ActionGroupMoveResponse(false, l , this);
            //throw new CannotMovePawnException("Invalid movement");
        }
        return actionGroupMoveResponse;
    }

    /**
     *  Moves the action group pawn in the specified destination.
     *  This method does not check if the destination is adjacent, so it should not be used for the standard
     *  movement action, only for special movement cases (e.g. bonus cards)
     *
     */
    public ActionGroupMoveResponse moveActionPawnNoCheck(GameState state, Location l) {
        state.movePawn(actionPawn, l);
        return new ActionGroupMoveResponse(true, l, this);
    }


    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(ActionGroup.class, new ActionGroupSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }


    @Override
    public String toString() {
        return getNameActionGroup();
    }

    public class ActionGroupSerializer implements JsonSerializer<ActionGroup> {

        @Override
        public JsonElement serialize(ActionGroup actionGroup, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("name", nameActionGroup);
            result.add("resources", provisions.toJson());
            return result;
        }
    }

}
