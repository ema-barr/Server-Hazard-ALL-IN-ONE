package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import it.uniba.hazard.engine.map.Area;
import it.uniba.hazard.engine.map.Location;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MapReader {

    public static List<Location> readLocations(String path){
        try {
            List<Emergency> emergencies = (List<Emergency>) Repository.getFromRepository("emergenciesList");
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element mapElem = (Element) gameElem.getElementsByTagName("map").item(0);

            NodeList areaNodeList = mapElem.getElementsByTagName("area");
            ArrayList<Location> locationsList = new ArrayList<Location>();

            for (int i = 0; i < areaNodeList.getLength(); i++){
                Element areaElem = (Element) areaNodeList.item(i);

                NodeList locationNodeList = areaElem.getElementsByTagName("location");
                for (int k = 0; k < locationNodeList.getLength(); k++){
                    Element locationElem = (Element) locationNodeList.item(k);
                    String nameLocation = locationElem.getElementsByTagName("name").item(0).getTextContent();
                    Location location = new Location(nameLocation, emergencies);
                    locationsList.add(location);
                }
            }
            return locationsList;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static Map<Location, List<Location>> readNeighbors(String path){
        try {
            List<Emergency> emergencies = (List<Emergency>) Repository.getFromRepository("emergenciesList");
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element mapElem = (Element) gameElem.getElementsByTagName("map").item(0);

            NodeList areaNodeList = mapElem.getElementsByTagName("area");
            HashMap<Location, List<Location>> neighborMap = new HashMap<Location, List<Location>>();

            for (int i = 0; i < areaNodeList.getLength(); i++){
                Element areaElem = (Element) areaNodeList.item(i);
                NodeList locationNodeList = areaElem.getElementsByTagName("location");
                for (int k = 0; k < locationNodeList.getLength(); k++){
                    Element locationElem = (Element) locationNodeList.item(k);
                    String nameLocation = locationElem.getElementsByTagName("name").item(0).getTextContent();
                    Location location = (Location) Repository.getFromRepository(Location.class.getName()+"_"+ nameLocation);

                    Element neighborhoodElem = (Element) locationElem.getElementsByTagName("neighborhood").item(0);
                    NodeList neighborsNodeList = neighborhoodElem.getElementsByTagName("neighbor");
                    ArrayList<Location> neighborList = new ArrayList<Location>();
                    for (int l = 0; l< neighborsNodeList.getLength(); l++){
                        Element neighborElem = (Element) neighborsNodeList.item(l);
                        String nameNeighbor = neighborElem.getTextContent();
                        Location neighbor = (Location) Repository.getFromRepository(Location.class.getName() + "_" + nameNeighbor);
                        neighborList.add(neighbor);
                    }
                    neighborMap.put(location, neighborList);
                }
            }
            return neighborMap;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        }
        return null;
    }


    public static List<Area> readAreas(String path){
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element mapElem = (Element) gameElem.getElementsByTagName("map").item(0);
            ArrayList<Area> areasList = new ArrayList<Area>();

            NodeList areaNodeList = mapElem.getElementsByTagName("area");
            for (int i = 0; i < areaNodeList.getLength(); i++){
                Element areaElem = (Element) areaNodeList.item(i);
                ArrayList<Location> locationsList = new ArrayList<Location>();

                NodeList locationNodeList = areaElem.getElementsByTagName("location");
                for (int k = 0; k < locationNodeList.getLength(); k++){
                    Element locationElem = (Element) locationNodeList.item(k);
                    String nameLocation = locationElem.getElementsByTagName("name").item(0).getTextContent();
                    Location location = (Location) Repository.getFromRepository(Location.class.getName() + "_" + nameLocation);
                    locationsList.add(location);
                }
                Area area = new Area(locationsList);
                areasList.add(area);
            }
            return areasList;
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
