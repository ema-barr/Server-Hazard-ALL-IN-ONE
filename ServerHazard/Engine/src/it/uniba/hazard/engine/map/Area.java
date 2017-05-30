package it.uniba.hazard.engine.map;

import it.uniba.hazard.engine.exception.LocationMismatchException;
import it.uniba.hazard.engine.exception.StrongholdAlreadyPresentException;
import it.uniba.hazard.engine.main.Stronghold;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by andrea_iovine on 24/12/2016.
 */
public class Area {
    private List<Location> locations;
    private List<Stronghold> strongholds;

    public Area(List<Location> locations) {
        this.locations = locations;
        strongholds = new ArrayList<Stronghold>();
    }

    public List<Location> getLocations() {
        return locations;
    }

    public List<Stronghold> getStrongholds() {
        return strongholds;
    }

    public void addStrongHold(Stronghold s) {
        //Check if there already is a stronghold in this area for the specified emergency
        for(Stronghold shold : strongholds) {
            if (shold.getEmergency().equals(s.getEmergency())) {
                throw new StrongholdAlreadyPresentException("There already is a stronghold for this emergency in the area.");
            }
        }
        //Check if the location belongs to the area
        if (locations.contains(s.getLocation())) {
            strongholds.add(s);
        } else {
            throw new LocationMismatchException("The location does not belong in this area.");
        }
    }

    public boolean contains(Location l) {
        return locations.contains(l);
    }
}
