package it.uniba.hazard.engine.util.xml_reader.card_reading;

import it.uniba.hazard.engine.cards.Card;
import it.uniba.hazard.engine.cards.MovePlace;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Location;
import org.w3c.dom.Element;

import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

/**
 * Created by isz_d on 28/03/2017.
 */
public class PlaceCardReader implements ICardReader {

    @Override
    public List<Card> readCard(Element e) {
        List<Card> result = new ArrayList<>();
        String name = e.getElementsByTagName("name").item(0).getTextContent();
        int quantity = Integer.parseInt(e.getElementsByTagName("quantity").item(0).getTextContent());

        List<Location> locations = (List<Location>) Repository.getFromRepository("locationsList");
        for (Location l : locations) {
            for (int i = 0; i < quantity; i++) {
                MessageFormat formatter= (MessageFormat) Repository.getFromRepository("messageFormat");
                ResourceBundle messages = (ResourceBundle) Repository.getFromRepository("resourceBundle");

                Object[] messageArgs = {l.toString()};
                formatter.applyPattern(messages.getString("MovePlace_description"));
                String description = formatter.format(messageArgs);
                String cardName = messages.getString("MovePlace_cardName");
                result.add(new MovePlace("MovePlace", l, cardName, description));
            }
        }
        return result;
    }
}
