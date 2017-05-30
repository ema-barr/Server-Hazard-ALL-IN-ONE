package it.uniba.hazard.engine.main;

import com.google.gson.*;

import java.lang.reflect.Type;

public class Resource {
    private String objectID;
    private String nameResource;

    public Resource(String nameResource){
        this.objectID = this.getClass().getName() + "_" + nameResource;
        this.nameResource = nameResource;
    }

    public String getObjectID() {
        return objectID;
    }

    public String getNameResource() {
        return nameResource;
    }

    @Override
    public boolean equals(Object o) {
        return ((Resource) o).getObjectID().equals(objectID);
    }

    @Override
    public String toString() {
        return nameResource;
    }

    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(Resource.class, new ResourceSerializer());
        return gb.create().toJsonTree(this);
    }

    public class ResourceSerializer implements JsonSerializer<Resource> {

        @Override
        public JsonElement serialize(Resource resource, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.addProperty("objectID", objectID);
            result.addProperty("name", nameResource);
            return result;
        }
    }
}
