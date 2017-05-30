package it.uniba.hazard.engine.main;

import com.google.gson.*;
import it.uniba.hazard.engine.util.response.Response;

import java.lang.reflect.Type;
import java.util.List;

/**
 * Created by andrea_iovine on 26/12/2016.
 */
public class Game {
    private GameState state;
    private TurnSequence turns;
    private GameController controller;

    public Game(GameState state, TurnSequence turns) {
        this.state = state;
        this.turns = turns;
        controller = new GameController();
    }

    public Game(GameState state, TurnSequence turns, GameController controller) {
        this.state = state;
        this.turns = turns;
        this.controller = controller;
    }

    public Response nextTurn() {
        turns.setNextTurn();
        Turn currentTurn = turns.getCurrentTurn();
        Response response = currentTurn.executeTurn(state);
        state.evaluateEndConditions();
        return response;
    }

    public TurnSequence getTurns() {
        return this.turns;
    }

    public GameState getState() {
        return this.state;
    }

    public JsonElement toJson() {
        GsonBuilder gsonBuilder = new GsonBuilder();
        gsonBuilder.registerTypeAdapter(Game.class, new GameSerializer());
        return gsonBuilder.create().toJsonTree(this);
    }

    public Response request(JsonElement reqData) {
        return controller.request(reqData, this);
    }

    public class GameSerializer implements JsonSerializer<Game> {

        @Override
        public JsonElement serialize(Game game, Type type, JsonSerializationContext jsonSerializationContext) {
            JsonObject result = new JsonObject();
            result.add("gameState", state.toJson());
            result.add("currentTurn", turns.getCurrentTurn().toJson());
            return result;
        }
    }
}
