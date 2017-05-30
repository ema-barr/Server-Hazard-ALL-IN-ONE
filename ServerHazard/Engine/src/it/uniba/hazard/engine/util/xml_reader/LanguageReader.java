package it.uniba.hazard.engine.util.xml_reader;

import it.uniba.hazard.engine.main.Resource;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Locale;

/**
 * Created by MANU on 22/03/2017.
 */
public class LanguageReader {
    public static Locale readLanguage(String path){
        try{
            File fXmlFile = new File(path);
            DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
            DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
            Document doc = dBuilder.parse(fXmlFile);
            doc.getDocumentElement().normalize();

            ArrayList<Resource> resources = new ArrayList<Resource>();

            Element gameElem = (Element) doc.getElementsByTagName("game").item(0);
            Element localeElem = (Element) gameElem.getElementsByTagName("locale").item(0);
            String language = localeElem.getElementsByTagName("language").item(0).getTextContent();
            String country = localeElem.getElementsByTagName("country").item(0).getTextContent();
            Locale locale = new Locale(language, country);
            return locale;
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
