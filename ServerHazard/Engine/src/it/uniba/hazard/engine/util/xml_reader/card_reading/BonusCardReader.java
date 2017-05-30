package it.uniba.hazard.engine.util.xml_reader.card_reading;

import it.uniba.hazard.engine.cards.Card;
import it.uniba.hazard.engine.exception.NoClassExist;
import it.uniba.hazard.engine.main.Repository;
import org.w3c.dom.Element;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

/**
 * This class is used to initialize standard bonus cards, each with a card name and a description (with no parameters)
 */
public class BonusCardReader implements ICardReader {
    @Override
    public List<Card> readCard(Element e) {
        List<Card> result = new ArrayList<>();
        String name = e.getElementsByTagName("name").item(0).getTextContent();
        int quantity = Integer.parseInt(e.getElementsByTagName("quantity").item(0).getTextContent());
        try {
            try {
                Constructor c = Class.forName("it.uniba.hazard.engine.cards." + name).getConstructor(String.class, String.class, String.class);
                try {
                    //Get name and description of the card from the resources
                    ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");
                    String cardName = messages.getString(name + "_cardName");
                    String description = messages.getString(name + "_description");
                    for (int i = 0; i < quantity; i++) {
                        result.add((Card) c.newInstance(name, cardName, description));
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
