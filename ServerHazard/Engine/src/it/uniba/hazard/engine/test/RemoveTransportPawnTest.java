package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.cards.EventCard;
import it.uniba.hazard.engine.cards.RemoveTransportPawn;
import it.uniba.hazard.engine.connection.ServerConnection;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.main.GameInitialization;
import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.turn.ProductionTurn;
import it.uniba.hazard.engine.util.response.Response;

import java.net.URISyntaxException;
import java.util.HashMap;

/**
 * Created by isz_d on 04/06/2017.
 */
public class RemoveTransportPawnTest {
    public static void main(String[] args) throws URISyntaxException {
        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
        Game g = gi.getGame();
        ServerConnection sc = new ServerConnection("http://localhost:6882", g);
        sc.startConnection();
        Provisions p = new Provisions(new HashMap<>());
        ProductionGroup pg = ((ProductionTurn) g.getTurns().getTurnOrder().get(0)).getPlayer();
        //pg.insertNewTransportPawn(g.getState(), p, (Location) g.getState().getMapLocations().toArray()[0]);
        EventCard c = new RemoveTransportPawn("test");
        Response r = c.getInstance().executeAction(g.getState(), g.getTurns().getCurrentTurn());
        System.out.println(r.toJson().toString());
    }
}
