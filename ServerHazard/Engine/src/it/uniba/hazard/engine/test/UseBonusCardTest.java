package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.main.GameInitialization;
import it.uniba.hazard.engine.main.Turn;
import it.uniba.hazard.engine.turn.ActionTurn;
import it.uniba.hazard.engine.util.response.Response;

import java.net.MalformedURLException;
import java.util.List;

/**
 * Created by isz_d on 09/03/2017.
 */
public class UseBonusCardTest {
    public static void main(String[] args) throws MalformedURLException {
        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
        Game g = gi.getGame();
        g.nextTurn();
        ActionTurn currentTurn = (ActionTurn) g.getTurns().getCurrentTurn();
        String[] params = {"addBonusCard"};
        currentTurn.runCommand(g.getState(), params);
        String[] params2 = {"useBonusCard", "0"};
        Response response = currentTurn.runCommand(g.getState(), params2);
        System.out.println(response.toJson());
        //Trigger a new turn to test bonus card revert
        currentTurn.executeTurn(g.getState());
    }

}
