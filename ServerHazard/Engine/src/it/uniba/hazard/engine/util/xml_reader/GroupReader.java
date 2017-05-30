package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.groups.ActionGroup;
import it.uniba.hazard.engine.groups.ProductionGroup;
import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Provisions;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.main.Resource;
import it.uniba.hazard.engine.map.Location;
import it.uniba.hazard.engine.pawns.TransportPawn;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class GroupReader {

    public static List<ActionGroup> readActionGrooups(String path) {
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element groupElem = (Element) gameElem.getElementsByTagName("groups").item(0);

            NodeList actionGroupNodes = groupElem.getElementsByTagName("actionGroup");

            ArrayList<ActionGroup> actionGroupsList = new ArrayList<ActionGroup>();
            ActionGroup actionGroup;

            if (actionGroupNodes != null && actionGroupNodes.getLength() > 0) {
                for (int i = 0; i < actionGroupNodes.getLength(); i++) {
                    Node nNode = actionGroupNodes.item(i);

                    Element element = (Element) nNode;
                    String name = element.getElementsByTagName("name").item(0).getTextContent();
                    Element emergenciesToSolveNode = (Element) element.getElementsByTagName("emergenciesToSolve").item(0);
                    NodeList emergenciesNodeList = emergenciesToSolveNode.getElementsByTagName("emergencyToSolve");
                    ArrayList<Emergency> emergenciesToSolve = new ArrayList<Emergency>();

                    for (int j = 0; j < emergenciesNodeList.getLength(); j++){
                        Element emergency = (Element) emergenciesNodeList.item(j);
                        Emergency em = (Emergency) Repository.getFromRepository(Emergency.class.getName() + "_" + emergency.getTextContent());
                        emergenciesToSolve.add(em);
                    }



                    Element resourcesUsed = (Element) element.getElementsByTagName("resourcesUsed").item(0);
                    NodeList resourceList = resourcesUsed.getElementsByTagName("resource");
                    ArrayList<Resource> resources = new ArrayList<Resource>();
                    if (resourceList != null && resourceList.getLength() > 0) {
                        for (int j = 0; j < resourceList.getLength(); j++) {
                            Element nRes = (Element) resourceList.item(j);

                            Resource res = new Resource(nRes.getTextContent());
                            resources.add(res);
                        }

                    }

                    Element hqs = (Element) element.getElementsByTagName("headquarters").item(0);
                    NodeList hqList = hqs.getElementsByTagName("headquarter");
                    ArrayList<Location> HQs = new ArrayList<Location>();
                    if (hqList != null && hqList.getLength() > 0) {
                        for (int j = 0; j < hqList.getLength(); j++) {
                            Element nHQ = (Element) hqList.item(j);

                            Location hq = (Location) Repository.getFromRepository(Location.class.getName() + "_" + nHQ.getTextContent());
                            HQs.add(hq);
                        }
                    }

                    Location start = (Location) Repository.getFromRepository(Location.class.getName() + "_" +
                            element.getElementsByTagName("startingPoint").item(0).getTextContent());
                    actionGroup = new ActionGroup( emergenciesToSolve,resources, null, name, HQs, start);
                    actionGroupsList.add(actionGroup);
                }
            }
            return actionGroupsList;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static List<ProductionGroup> readProductionGrooups(String path) {
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element groupElem = (Element) gameElem.getElementsByTagName("groups").item(0);
            ArrayList<ProductionGroup> productionGroups = new ArrayList<ProductionGroup>();

            NodeList productionGroupNodes = groupElem.getElementsByTagName("productionGroup");
            for (int i = 0; i < productionGroupNodes.getLength(); i++) {
                Node nProductionGroup = productionGroupNodes.item(i);
                Element element = (Element) nProductionGroup;

                String name = element.getElementsByTagName("name").item(0).getTextContent();
                int maxTransportPawns = Integer.parseInt(element.getElementsByTagName("maxNumTransportPawns")
                        .item(0).getTextContent());
                ArrayList<TransportPawn> transportPawns = new ArrayList<TransportPawn>(maxTransportPawns);
                ProductionGroup productionGroup = new ProductionGroup(transportPawns, name, maxTransportPawns);
                productionGroups.add(productionGroup);
            }
            return productionGroups;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return null;
    }
}
