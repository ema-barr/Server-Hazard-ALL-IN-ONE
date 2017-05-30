package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.util.response.action_group.ActionGroupMoveResponse;

/**
 * Created by MANU on 22/03/2017.
 */
public class InternationalizationTest {
    public static void main(String args[]){
        ActionGroupMoveResponse actionGroupMoveResponse = new ActionGroupMoveResponse(true, null, new ActionGroup(null, null,null,"Gruppo1", null,null));
        System.out.println(actionGroupMoveResponse.toJson());
    }
}
