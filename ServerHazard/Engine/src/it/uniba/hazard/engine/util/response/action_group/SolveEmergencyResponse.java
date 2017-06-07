package it.uniba.hazard.engine.util.response.action_group;

import com.google.gson.JsonObject;
import it.uniba.hazard.engine.exception.EmergencyMismatchException;
import it.uniba.hazard.engine.exception.InsufficientResourcesException;
import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.util.response.Response;

import java.text.MessageFormat;
import java.util.ResourceBundle;

/**
 * Created by emanu on 25/02/2017.
 */
public class SolveEmergencyResponse implements Response{
    private static final String CANNOT_CURE_STRING = "Il gruppo %s non può curare %s";
    private static final String INSUFFICIENT_FUNDS_STRING = "Non si dispone delle risorse necessarie per curare %s";
    private boolean success;
    private Emergency emergencyToSolve;
    private ActionGroup actionGroup;
    private String logString;

    public SolveEmergencyResponse(boolean success,
                                  Emergency emergencyToSolve,
                                  ActionGroup actionGroup){
        this.success = success;
        this.emergencyToSolve = emergencyToSolve;
        this.actionGroup = actionGroup;

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        if (success){
            Object[] messageArgs = {actionGroup.getNameActionGroup(), emergencyToSolve.toString()};
            formatter.applyPattern(messages.getString("SolveEmergencyResponse_success"));
            logString = formatter.format(messageArgs);
        } else {
            Object[] messageArgs = {actionGroup.getNameActionGroup(), emergencyToSolve.toString()};
            formatter.applyPattern(messages.getString("SolveEmergencyResponse_failure_nothing_to_solve"));
            logString = formatter.format(messageArgs);
        }
    }

    public SolveEmergencyResponse(boolean success,
                                  Emergency emergencyToSolve,
                                  ActionGroup actionGroup,
                                  EmergencyMismatchException e){
        this(success, emergencyToSolve, actionGroup);

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        Object[] messageArgs = {actionGroup.getNameActionGroup(), emergencyToSolve.toString()};
        formatter.applyPattern(messages.getString("SolveEmergencyResponse_failure"));
        logString = formatter.format(messageArgs);
    }

    public SolveEmergencyResponse(boolean success,
                                  Emergency emergencyToSolve,
                                  ActionGroup actionGroup,
                                  InsufficientResourcesException e){
        this(success, emergencyToSolve, actionGroup);

        MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
        ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

        Object[] messageArgs = {emergencyToSolve.toString()};
        formatter.applyPattern(messages.getString("SolveEmergencyResponse_failure_insufficient_resources"));
        logString = formatter.format(messageArgs);
        logString = String.format(INSUFFICIENT_FUNDS_STRING, emergencyToSolve.toString());
    }


    @Override
    public String toJson() {
        JsonObject res = new JsonObject();
        res.addProperty("success", success);
        res.addProperty("actionName", "ACTION_GROUP_SOLVE_EMERGENCY");
        res.addProperty("emergencyToSolve", emergencyToSolve.toString());
        res.addProperty("actionGroup", actionGroup.toString());
        res.addProperty("logString", logString);
        return res.toString();
    }

    public boolean success() {
        return success;
    }
}
