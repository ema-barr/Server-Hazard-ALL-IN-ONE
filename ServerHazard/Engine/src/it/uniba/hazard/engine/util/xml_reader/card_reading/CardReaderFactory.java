package it.uniba.hazard.engine.util.xml_reader.card_reading;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by isz_d on 28/03/2017.
 */
public class CardReaderFactory {
    private static Map<String, ICardReader> readers;

    static {
        //Initialize the reader factory mapping
        readers = new HashMap<String, ICardReader>();
        //Standard bonus card creators
        readers.put("CurePlace", new BonusCardReader());
        readers.put("IncreaseNumberAction", new BonusCardReader());
        readers.put("QuarantinePlace", new BonusCardReader());
        //Here will be added all the non-standard card creators.
        readers.put("MovePlace", new PlaceCardReader());
        readers.put("ProductionCard", new ProductionCardReader());
        //Default card reader
        readers.put("Default", new StandardCardReader());
    }

    /**
     * Returns the appropriate CardReader object, given the name of the card to read. If the card specified is not
     * one of the card specified in the readers map, an instance of StandardCardReader will be returned.
     * @param s
     */
    public static ICardReader getReader(String s) {
        if (!readers.containsKey(s)) {
            return readers.get("Default");
        } else {
            return readers.get(s);
        }
    }

}
