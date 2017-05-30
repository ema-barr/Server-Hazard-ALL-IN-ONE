package it.uniba.hazard.engine.main;

import it.uniba.hazard.engine.exception.*;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.ActionPawn;
import it.uniba.hazard.engine.pawns.StrongholdPawn;
import it.uniba.hazard.engine.pawns.TransportPawn;

import java.util.Map;

public class Repository {

    private static Map<String, Object> repository;

    public Repository(Map<String, Object> repository) {
        this.repository = repository;
    }

    public static void insertInRepository(String objectID, Object object){
        repository.put(objectID, object);
    }

    public static void deleteFromRepository(String objectID){
        if (repository.containsKey(objectID)){
            repository.remove(objectID);
        }else{
            throw new ObjectNotFoundInRepositoryException("Object not found in repository");
        }
    }

    public static Object getFromRepository(String objectID){
        if (repository.containsKey(objectID)){
            return repository.get(objectID);
        }else{
            throw new ObjectNotFoundInRepositoryException("Object not found in repository");
        }

    }

    /* NON USARE
    public static ActionGroup getActionGroupFromRepository(String objectID){
        boolean checkActionGroup;
        checkActionGroup = objectID.startsWith(ActionGroup.class.getName());
        if (checkActionGroup){
            return (ActionGroup) getFromRepository(objectID);
        } else {
            throw new ObjectNotActionGroupException("Object with objectID " + objectID + "is not an ActionGroup" );
        }
    }

    public static ProductionGroup getProductionGroupFromRepository(String objectID){
        boolean checkProdGroup;
        checkProdGroup = objectID.startsWith(ProductionGroup.class.getName());
        if (checkProdGroup){
            return (ProductionGroup) getFromRepository(objectID);
        } else {
            throw new ObjectNotProductionGroupException("Object with objectID " + objectID + "is not a ProductionGroup" );
        }
    }

    public static Location getLocationFromRepository(String objectID){
        boolean checkLocation;
        checkLocation = objectID.startsWith(Location.class.getName());
        if (checkLocation){
            return (Location) getFromRepository(objectID);
        } else {
            throw new ObjectNotLocationException("Object with objectID " + objectID + "is not a Location" );
        }
    }

    public static ActionPawn getActionPawnFromRepository(String objectID){
        boolean checkActionPawn;
        checkActionPawn = objectID.startsWith(ActionPawn.class.getName());
        if (checkActionPawn){
            return (ActionPawn) getFromRepository(objectID);
        } else {
            throw new ObjectNotActionPawnException("Object with objectID " + objectID + "is not an ActionPawn" );
        }
    }

    public static TransportPawn getTransportPawnFromRepository(String objectID){
        boolean checkTransportPawn;
        checkTransportPawn = objectID.startsWith(TransportPawn.class.getName());
        if (checkTransportPawn){
            return (TransportPawn) getFromRepository(objectID);
        } else {
            throw new ObjectNotTransportPawnException("Object with objectID " + objectID + "is not a TransportPawn" );
        }
    }

    public static StrongholdPawn getStrongholdPawnFromRepository(String objectID){
        boolean checkStrongholdPawn;
        checkStrongholdPawn = objectID.startsWith(StrongholdPawn.class.getName());
        if (checkStrongholdPawn){
            return (StrongholdPawn) getFromRepository(objectID);
        } else {
            throw new ObjectNotStrongholdPawnException("Object with objectID " + objectID + "is not a StrongholdPawn" );
        }
    }

    */
}
