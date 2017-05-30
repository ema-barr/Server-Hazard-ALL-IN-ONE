package it.uniba.hazard.engine.util.xml_reader;


import it.uniba.hazard.engine.main.Resource;
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
import java.util.List;

public class ResourceReader {
    public static List<Resource> readResources(String path) {
        try {
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            ArrayList<Resource> resources = new ArrayList<Resource>();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element resElem = (Element) gameElem.getElementsByTagName("resources").item(0);

            NodeList resourceList = resElem.getElementsByTagName("name");
            for (int i = 0; i < resourceList.getLength(); i++) {
                Element element = (Element) resourceList.item(i);
                Resource res = new Resource(element.getTextContent());
                resources.add(res);
            }
            return resources;
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
