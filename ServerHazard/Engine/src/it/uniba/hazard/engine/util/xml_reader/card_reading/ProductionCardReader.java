package it.uniba.hazard.engine.util.xml_reader.card_reading;

import it.uniba.hazard.engine.cards.Card;
import it.uniba.hazard.engine.cards.ProductionCard;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.map.Location;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * Created by isz_d on 29/03/2017.
 */
public class ProductionCardReader implements ICardReader {
    @Override
    public List<Card> readCard(Element prodCardNode) {
        List<Card> result = new ArrayList<>();
        int quantity = Integer.parseInt(prodCardNode.getElementsByTagName("quantity").item(0).getTextContent());
        String l = prodCardNode.getElementsByTagName("location").item(0).getTextContent();
        Location location = (Location) Repository.getFromRepository(Location.class.getName() + "_" + l);
        Element resourcesElem = (Element) prodCardNode.getElementsByTagName("resourcesProd").item(0);
        NodeList resourcesProdNodeList = resourcesElem.getElementsByTagName("resourceProd");

        for (int i = 0; i < quantity; i++) {
            HashMap<Resource, Integer> resourcesProd = new HashMap<Resource, Integer>();
            for (int j = 0; j<resourcesProdNodeList.getLength(); j++){
                Element resourceProdNode = (Element) resourcesProdNodeList.item(j);

                String resource = resourceProdNode.getElementsByTagName("resource").item(0).getTextContent();
                Resource res = (Resource) Repository.getFromRepository(Resource.class.getName() + "_" + resource);
                int quantRes = Integer.parseInt(resourceProdNode.getElementsByTagName("quantity").item(0).getTextContent());
                resourcesProd.put(res, quantRes);
            }
            result.add(new ProductionCard(location, resourcesProd));
        }
        return result;
    }
}
