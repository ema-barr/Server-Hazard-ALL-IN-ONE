package it.uniba.hazard.engine.connection.listeners;

import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import it.uniba.hazard.engine.main.Game;

/**
 * Created by isz_d on 28/02/2017.
 */
public abstract class Listener implements Emitter.Listener {
    Game game;
    Socket socket;

    public Listener(Socket socket, Game game) {
        this.socket = socket;
        this.game = game;
    }
}
