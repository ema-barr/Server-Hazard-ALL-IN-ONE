package it.uniba.hazard.engine.test;

import it.uniba.hazard.engine.main.GameInitialization;

import java.net.MalformedURLException;

public class InitializationTest {
    public static void main(String[] args) throws MalformedURLException {
        GameInitialization gi = new GameInitialization("strutturaxml.xml");
        gi.initialization();
    }
}
