package it.uniba.hazard.engine.connection.listeners;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import io.socket.client.Ack;
import io.socket.client.Socket;
import it.uniba.hazard.engine.main.Game;
import it.uniba.hazard.engine.util.response.Response;
import org.json.JSONObject;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by isz_d on 28/02/2017.
 */
public class RequestListener extends Listener {
    private final static Logger LOGGER = Logger.getLogger(RequestListener.class.getName());

    public RequestListener(Socket socket, Game game) {
        super(socket, game);
    }

    @Override
    public void call(Object... args) {
        JsonParser parser = new JsonParser();
        JsonElement reqObject = parser.parse(((JSONObject) args[0]).toString());
        LOGGER.log(Level.INFO, "Received request from server. Request is: " + reqObject.toString());
        Ack ack = (Ack) args[args.length - 1];
        Response response = game.request(reqObject);
        ack.call(response.toJson());
    }
}
