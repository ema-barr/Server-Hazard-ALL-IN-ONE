package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.main.Emergency;
import it.uniba.hazard.engine.main.Repository;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class SetupReader {
    public static Map<Emergency, Map<Integer, Integer>> readSetup(String path){
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element setupElem = (Element) gameElem.getElementsByTagName("setup").item(0);

            NodeList emergencySetups = setupElem.getElementsByTagName("emergencySetup");
            HashMap<Emergency, Map<Integer, Integer>> setupMap = new HashMap<Emergency, Map<Integer, Integer>>();

            for (int i = 0; i < emergencySetups.getLength(); i++){
                Element node = (Element) emergencySetups.item(i);

                String emergency = node.getElementsByTagName("emergency").item(0).getTextContent();
                Emergency em = (Emergency) Repository.getFromRepository(Emergency.class.getName() + "_" + emergency);

                Element settElem = (Element) node.getElementsByTagName("settings").item(0);
                NodeList settingList = settElem.getElementsByTagName("setting");
                HashMap<Integer, Integer> settingsMap = new HashMap<Integer, Integer>();
                for (int k = 0; k < settingList.getLength(); k++){
                    Element settNode = (Element) settingList.item(k);

                    int gravityLevel = Integer.parseInt(settNode.getElementsByTagName("gravityLevel").item(0).getTextContent());
                    int numLocation = Integer.parseInt(settNode.getElementsByTagName("numLocation").item(0).getTextContent());

                    settingsMap.put(gravityLevel, numLocation);
                }
                setupMap.put(em, settingsMap);
            }
            return setupMap;
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
