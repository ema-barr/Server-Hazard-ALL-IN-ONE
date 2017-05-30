package it.uniba.hazard.engine.connection.listeners;

import io.socket.client.Ack;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import it.uniba.hazard.engine.connection.ServerConnection;
import it.uniba.hazard.engine.main.Game;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * This class listens to the "welcome" server message, and sends back a message to the server identifying itself as
 * the game engine.
 */
public class ServerConnectionListener extends Listener {
    private final static Logger LOGGER = Logger.getLogger(ServerConnectionListener.class.getName());

    public ServerConnectionListener(Socket socket, Game game) {
        super(socket, game);
    }

    @Override
    public void call(Object... args) {
        LOGGER.log(Level.INFO, "Connected to server. Identifying...");
        socket.emit("init_engine", args, new Ack() {
            @Override
            public void call(Object... args) {
                LOGGER.log(Level.INFO, "Identification is successful!");
            }
        });
    }
}
