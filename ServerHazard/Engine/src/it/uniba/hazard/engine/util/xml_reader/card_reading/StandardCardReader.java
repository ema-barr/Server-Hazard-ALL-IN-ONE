package it.uniba.hazard.engine.util.xml_reader.card_reading;

import it.uniba.hazard.engine.cards.Card;
import it.uniba.hazard.engine.exception.NoClassExist;
import org.w3c.dom.Element;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by isz_d on 28/03/2017.
 */
public class StandardCardReader implements ICardReader {
    @Override
    public List<Card> readCard(Element e) {
        List<Card> result = new ArrayList<>();
        String name = e.getElementsByTagName("name").item(0).getTextContent();
        int quantity = Integer.parseInt(e.getElementsByTagName("quantity").item(0).getTextContent());
        try {
            try {
                Constructor c = Class.forName("it.uniba.hazard.engine.cards." + name).getConstructor(String.class);
                try {
                    for (int i = 0; i < quantity; i++) {
                        result.add((Card) c.newInstance(name));
                    }
                } catch (InstantiationException | IllegalAccessException | InvocationTargetException ex) {
                    ex.printStackTrace();
                }
            } catch (NoSuchMethodException ex) {
                ex.printStackTrace();
            }
        } catch (ClassNotFoundException ex) {
            throw new NoClassExist("Classe non istanziata");
        }
        return result;
    }
}
