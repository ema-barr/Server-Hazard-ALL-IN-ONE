package it.uniba.hazard.engine.entrypoint;

import it.uniba.hazard.engine.connection.ServerConnection;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.main.GameInitialization;

import java.net.MalformedURLException;
import java.net.URISyntaxException;

/**
 * Created by isz_d on 05/05/2017.
 */
public class EntryPoint {
    public static void main(String[] args) throws URISyntaxException, MalformedURLException {
        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
        Game g = gi.getGame();
        ServerConnection sc = new ServerConnection("http://localhost:6882", g);
        sc.startConnection();
    }
}
