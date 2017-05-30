package it.uniba.hazard.engine.util.xml_reader.card_reading;

import it.uniba.hazard.engine.cards.Card;
import org.w3c.dom.Element;

import java.util.List;

/**
 * Created by isz_d on 28/03/2017.
 */
public interface ICardReader {
    public List<Card> readCard(Element e);
}
