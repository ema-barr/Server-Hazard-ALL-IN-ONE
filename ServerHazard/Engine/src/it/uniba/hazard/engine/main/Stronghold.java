package it.uniba.hazard.engine.main;

import it.uniba.hazard.engine.map.Location;

public class Stronghold {
    private String objectID;
    private Location location;
    private StrongholdInfo strongholdInfo;

    public Stronghold(Location location, StrongholdInfo strongholdInfo){
        this.objectID = this.getClass().getName() + "_" + location.toString() + "_" + strongholdInfo.getEmergency().toString();
        this.location = location;
        this.strongholdInfo = strongholdInfo;
    }

    public String getObjectID() {
        return objectID;
    }

    public Emergency getEmergency(){
        return strongholdInfo.getEmergency();
    }

    public Location getLocation() {
        return location;
    }

    public StrongholdInfo getStrongholdInfo() {
        return strongholdInfo;
    }

    @Override
    public String toString() {
        return location.toString() + "_" + strongholdInfo.getEmergency().toString();
    }
}
