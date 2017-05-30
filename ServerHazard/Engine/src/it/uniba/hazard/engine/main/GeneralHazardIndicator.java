package it.uniba.hazard.engine.main;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.util.List;

/**
 * Created by andrea_iovine on 24/12/2016.
 */
public class GeneralHazardIndicator {
    private List<Integer> steps;
    private int currentStep;

    public GeneralHazardIndicator(List<Integer> steps) {
        currentStep = 0;
        this.steps = steps;
    }


    public void raiseHazardLevel() {
        if (currentStep < steps.size()) {
            currentStep++;
        }
    }

    public int getCurrentLevel() {
        return steps.get(currentStep);
    }

    public JsonElement toJson() {
        GsonBuilder gb = new GsonBuilder();
        gb.registerTypeAdapter(GeneralHazardIndicator.class, new GeneralHazardIndicatorSerializer());
        return gb.create().toJsonTree(this);
    }

    public class GeneralHazardIndicatorSerializer implements JsonSerializer<GeneralHazardIndicator> {

        @Override
        public JsonElement serialize(GeneralHazardIndicator generalHazardIndicator, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            JsonArray stepsJson = new JsonArray();
            for (int i : steps) {
                stepsJson.add(i);
            }
            result.add("steps", stepsJson);
            result.addProperty("currentStepIndex", currentStep);
            return result;
        }
    }
}
