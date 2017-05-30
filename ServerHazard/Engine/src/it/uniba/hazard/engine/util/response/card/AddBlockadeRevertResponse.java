package it.uniba.hazard.engine.util.response.card;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.ResourceBundle;

/**
 * Created by denny on 03/03/2017.
 */
public class AddBlockadeRevertResponse implements Response{
    private boolean success;
    private ArrayList<Location> locationsUnlocked;
    private String logString;

    public AddBlockadeRevertResponse(boolean success, ArrayList<Location> locationsUnlocked){
        this.locationsUnlocked = locationsUnlocked;
        this.success = success;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if(success){
            String locsStr = "";
            for (Location loc: locationsUnlocked){
                locsStr += loc + " ";
            }
            Object[] messageArgs = {locsStr};
            formatter.applyPattern(messages.getString("AddBlockadeRevertResponse_success"));
            logString = formatter.format(messageArgs);
        }else{
            logString = messages.getString("AddBlockadeRevertResponse_failure");
        }
    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        JsonArray array = new JsonArray();
        for (Location loc: locationsUnlocked){
            array.add(loc.toString());
        }
        res.addProperty("success", success);
        res.addProperty("actionName", "EVENT_CARD_ADD_BLOCKADE_REVERT");
        res.add("locationsUnlocked", array);
        res.addProperty("logString", logString);
        return res.toString();
    }
}
