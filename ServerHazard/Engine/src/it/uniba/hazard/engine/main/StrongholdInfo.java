package it.uniba.hazard.engine.main;

//classe per conservare tutte le informazioni relative ai presidi
public class StrongholdInfo {
    private String objectID;
    private Emergency emergency;
    private Resource resourceNeeded;
    private String strongholdName;

    public StrongholdInfo(Emergency emergency, Resource resourceNeeded, String strongholdName){
        this.objectID = this.getClass().getName() + "_" + emergency;
        this.emergency = emergency;
        this.resourceNeeded = resourceNeeded;
        this.strongholdName = strongholdName;
    }

    public Emergency getEmergency() {
        return emergency;
    }

    public Resource getResourceNeeded() {
        return resourceNeeded;
    }

    public String getStrongholdName() {
        return strongholdName;
    }

    public String toString(){
        return this.getClass().getName() + "_" + emergency;
    }
}
