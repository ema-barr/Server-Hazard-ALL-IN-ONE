package it.uniba.hazard.engine.entrypoint;

import it.uniba.hazard.engine.connection.ServerConnection;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.main.GameInitialization;

import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.util.Properties;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogManager;

/**
 * Created by isz_d on 05/05/2017.
 */
public class EntryPoint {
    private final static java.util.logging.Logger LOGGER = java.util.logging.Logger.getLogger(EntryPoint.class.getName());

    public static void main(String[] args) throws URISyntaxException, MalformedURLException {
        setUpLogger();

        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
        Game g = gi.getGame();
        ServerConnection sc = new ServerConnection("http://localhost:6882", g);
        sc.startConnection();
    }

    private static void setUpLogger() {
        System.out.println("Setting up logger configuration...");
        try {
            System.setProperty("java.util.logging.config.file", "logging.properties");
            LogManager lm = LogManager.getLogManager();
            lm.readConfiguration();
        } catch (IOException ex)
        {
            System.out.println("WARNING: Could not open configuration file");
            System.out.println("WARNING: Logging not configured (console output only)");
        }
    }
}
