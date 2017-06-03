package it.uniba.hazard.engine.main;

import com.google.gson.*;
import it.uniba.hazard.engine.exception.ResourceNotFoundException;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Provisions {
    private static int id = -1;
    private String objectID;
    private Map<Resource, Integer> resources;

    public Provisions(){
        id++;
        objectID = this.getClass().getName() + "_" + id;
        this.resources = new HashMap<Resource, Integer>();
    }

    public Provisions(Map<Resource, Integer> resources){
        id++;
        objectID = this.getClass().getName() + "_" + id;
        this.resources = resources;
    }

    public List<Resource> getListResources(){
        ArrayList<Resource> listResources = new ArrayList<Resource>();
        for(Resource resource: resources.keySet()){
            listResources.add(resource);
        }
        return listResources;
    }

    public int getQuantity(Resource res){
        int quantity = -1;
        for(Resource resource: resources.keySet()){
            if(res.equals(resource)){
                quantity =  resources.get(resource);
            }
        }
        return quantity;
    }

    public int withdrawResource(Resource res) {
        int quantity = getQuantity(res);
        resources.remove(res);
        return quantity;
    }

    public void addResource(Resource res, int quantity) {
        int prevQuantity = 0;
        if (resources.containsKey(res)) {
            prevQuantity = resources.get(res);
            resources.remove(res);
        }
        resources.put(res, prevQuantity + quantity);
    }

    public boolean isEmpty() {
        return resources.isEmpty();
    }

    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(Provisions.class, new ProvisionsSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public Map<Resource, Integer> getResources() {
        return resources;
    }

    @Override
    public String toString() {
        return objectID;
    }

    public class ProvisionsSerializer implements JsonSerializer<Provisions> {

        @Override
        public JsonElement serialize(Provisions provisions, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonArray result = new JsonArray();
            for (Resource r : resources.keySet()) {
                JsonObject resJson = new JsonObject();
                resJson.addProperty("resource", r.getNameResource());
                resJson.addProperty("quantity", resources.get(r));
                result.add(resJson);
            }
            return result;
        }
    }

    public Provisions clone(){
        Provisions clone = new Provisions();
        for (Resource res: this.getListResources()){
            int quantity = this.getQuantity(res);
            clone.addResource(res, quantity);
        }

        return  clone;
    }
}
