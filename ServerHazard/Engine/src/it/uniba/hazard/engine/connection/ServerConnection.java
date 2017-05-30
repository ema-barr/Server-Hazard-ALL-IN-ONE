package it.uniba.hazard.engine.connection;

import it.uniba.hazard.engine.connection.listeners.RequestListener;
import it.uniba.hazard.engine.connection.listeners.ServerConnectionListener;
import it.uniba.hazard.engine.main.Game;

import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

import java.net.URISyntaxException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class ServerConnection {
    private final static Logger LOGGER = Logger.getLogger(ServerConnection.class.getName());
    private Game game;
    private String connectionUrl;
    private Socket socket;

    public ServerConnection(String connectionUrl, Game game) throws URISyntaxException {
        this.connectionUrl = connectionUrl;
        this.game = game;
        socket = IO.socket(this.connectionUrl);
        initializeListeners();
    }

    public void startConnection() {
        LOGGER.log(Level.INFO, "Game engine server connection is started. Connecting to " + connectionUrl);
        socket.connect();
    }

    private void initializeListeners() {
        socket.on("welcome", new ServerConnectionListener(socket, game));
        socket.on("request", new RequestListener(socket, game));
    }
}
