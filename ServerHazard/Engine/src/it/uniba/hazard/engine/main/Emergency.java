package it.uniba.hazard.engine.main;

import com.google.gson.*;
import java.lang.reflect.Type;

public class Emergency {
    private String objectID;
    private String nameEmergency;
    private Resource resourceNeeded;
    private GeneralHazardIndicator generalHazardIndicator;

    public Emergency(String nameEmergency, Resource resourceNeeded, GeneralHazardIndicator generalHazardIndicator){
        this.objectID = this.getClass().getName() + "_" + nameEmergency;
        this.resourceNeeded = resourceNeeded;
        this.nameEmergency = nameEmergency;
        this.generalHazardIndicator = generalHazardIndicator;
    }

    public GeneralHazardIndicator getGeneralHazardIndicator(){
        return generalHazardIndicator;
    }

    public String getObjectID() {
        return objectID;
    }

    public String getNameEmergency() {
        return nameEmergency;
    }

    public Resource getResourceNeeded() {
        return resourceNeeded;
    }

    @Override
    public String toString() {
        return nameEmergency;
    }

    public boolean equals(Object o) {
        return ((Emergency) o).nameEmergency.equals(nameEmergency);
    }

    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(Emergency.class, new EmergencySerializer());
        return gb.create().toJsonTree(this);
    }

    public class EmergencySerializer implements JsonSerializer<Emergency> {

        @Override
        public JsonElement serialize(Emergency emergency, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("name", nameEmergency);
            result.add("resourceNeeded", resourceNeeded.toJson());
            result.addProperty("objectID", objectID);
            result.add("generalHazardIndicator", generalHazardIndicator.toJson());
            return result;
        }
    }
}
