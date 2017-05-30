package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.main.*;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;

import java.net.MalformedURLException;

/**
 * Created by isz_d on 09/03/2017.
 */
public class StrongholdTest {
    public static void main(String[] args) throws MalformedURLException {
        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
        Game g = gi.getGame();
        g.nextTurn();
        Emergency emergency = g.getState().getEmergencies().get(0);
        ActionTurn currentTurn = (ActionTurn) g.getTurns().getCurrentTurn();
        Provisions p = new Provisions();
        p.addResource(new Resource("Risorsa1"), 5);
        currentTurn.getPlayer().setProvisions(p);
        StrongholdInfo si = new StrongholdInfo(emergency, new Resource("Risorsa1"), "Prova");
        Repository.insertInRepository("StrongholdInfo_" + emergency.getNameEmergency(), si);
        String[] params = {"buildStronghold", emergency.getObjectID(), Location.class.getName() + "_Location2"};
        Response response = currentTurn.runCommand(g.getState(), params);
        System.out.println(response.toJson());
        response = currentTurn.runCommand(g.getState(), params);
        System.out.println(response.toJson());
    }

}
